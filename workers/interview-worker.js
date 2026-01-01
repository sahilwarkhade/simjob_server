import "dotenv/config.js";
import { Worker } from "bullmq";
import { feedbackQueue, INTERVIEW_QUEUE_NAME } from "../config/bullmq.js";
import { connection } from "../config/redis.js";
import { streamTextToSpeech } from "../services/googleTTS.js";
import { getGeminiResponseStream } from "../services/gemini.js";
import {
  addToHistory,
  deleteHistory,
  getHistory,
} from "../services/historyManager.js";
import MockInterview from "../models/MockInterview.model.js";
import { deleteInstructions } from "../utils/MockInterview/sytemInstructions/index.js";
import connectDB from "../config/DB.js";
await connectDB();
// The main worker process that listens for jobs on the queue.
const worker = new Worker(
  INTERVIEW_QUEUE_NAME,
  async (job) => {
    const { sessionId } = job.data;
    try {
      switch (job.name) {
        // Handles the AI's initial greeting.
        case "start_interview":
          addToHistory(
            sessionId,
            JSON.stringify({ role: "model", parts: [{ text: job.data.text }] })
          );
          await streamTextToSpeech(job.data.text, sessionId);
          break;

        // Handles user not reponding state
        case "user_not_responding":
          const NUDGE_MESSAGES = [
            "Just checking in, are you still there?",
            "It seems like you might be thinking. Would you like a hint, or should we move on?",
            "I haven't heard back in a while. The interview will be paused. Say 'I'm back' to continue.",
          ];
          const nudgeText = NUDGE_MESSAGES[job.data.nudgeLevel];
          if (nudgeText) {
            console.log(
              `Playing nudge level ${job.data.nudgeLevel}: "${nudgeText}"`
            );
            addToHistory(
              sessionId,
              JSON.stringify({ role: "model", parts: [{ text: nudgeText }] })
            );
            await streamTextToSpeech(nudgeText, sessionId);
          }
          break;

        // Handles generating the AI's response after the user has spoken.
        case "generate_response":
          connection.publish(
            `session:${sessionId}:transcript`,
            JSON.stringify({ type: "status", message: "Thinking..." }).toString(
              "base64"
            )
          );
          // const history = conversationHistory.get(sessionId);
          const history = job.data.history || [];
          const instructions = job.data.instructions || "";

          const geminiStream = getGeminiResponseStream(history, instructions);
          let fullAiResponse = "";
          let sentenceFragment = "";

          // This loop consumes the AI's response word-by-word.
          for await (const textChunk of geminiStream) {
            fullAiResponse += textChunk;
            sentenceFragment += textChunk;
            const punctuationRegex = /(?<=[.!?])\s+/;
            // When a full sentence is detected, pipeline it to TTS.
            if (punctuationRegex.test(sentenceFragment)) {
              const sentenceToSend = sentenceFragment.trim();
              // This is a "fire-and-forget" call to start TTS generation immediately.
              await streamTextToSpeech(sentenceToSend, sessionId);
              connection.publish(
                `session:${sessionId}:transcript`,
                JSON.stringify({
                  type: "ai_transcript_fragment",
                  fragment: sentenceToSend,
                }).toString("base64")
              );
              sentenceFragment = "";
            }
          }
          // Send any leftover text that didn't end in punctuation.
          if (sentenceFragment.trim()) {
            const finalFragment = sentenceFragment.trim();
            await streamTextToSpeech(finalFragment, sessionId);
            connection.publish(
              `session:${sessionId}:transcript`,
              JSON.stringify({
                type: "ai_transcript_fragment",
                fragment: finalFragment,
              }).toString("base64")
            );
          }

          // Once the full response is generated, add it to the conversation history.
          if (fullAiResponse) {
            addToHistory(
              sessionId,
              JSON.stringify({
                role: "model",
                parts: [{ text: fullAiResponse }],
              })
            );
          }
          connection.publish(
            `session:${sessionId}:transcript`,
            JSON.stringify({
              type: "status",
              message: "Waiting for your response...",
            }).toString("base64")
          );
          break;

        // Handles end interview
        case "end_interview":
          const { interviewId, duration } = job.data;
          const fullHistory = await getHistory(sessionId);
          await MockInterview.findByIdAndUpdate(
            interviewId,
            {
              $set: {
                transcript: JSON.stringify(fullHistory),
                duration: duration || 60,
              },
            }
          );
          await feedbackQueue.add(
            "interview-feedback",
            { interviewId },
            { jobId: `interview-feedback-${interviewId}` }
          );
          await deleteHistory(sessionId);
          await deleteInstructions(interviewId);
          break;
      }
    } catch (error) {
      console.error(
        `[Worker|Job ${job.id}] 💥 Error in handler for '${job.name}':`,
        error
      );
      throw error;
    }
  },
  {
    connection,
  }
);

worker.on("failed", (job, err) => {
  console.error(
    `[Worker] ❌ Job ${job.id} ('${job.name}') failed with error: ${err.message}`
  );
});

worker.on("ready", () => {
  console.log("INTERVIEW WORKER IS READY");
});
