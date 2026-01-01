import { interviewQueue } from "../config/bullMq.js";
import { connection } from "../config/redis.js";
import { generateSummary } from "./gemini.js";
import { createRecognitionStream } from "./googleSTT.js";
import {
  addToHistory,
  getHistory,
  getWindowedHistory,
  saveSummary,
  WINDOW_SIZE,
} from "./historyManager.js";

const activeSttStreams = new Map();
const inactivityTimers = new Map();
const latestFinalTranscript = new Map();
const turnHasEnded = new Map();
const INACTIVITY_TIMEOUT_MS = 3000;

async function tryProcessFinalTranscript(sessionId,instructions) {
  if (turnHasEnded.get(sessionId) && latestFinalTranscript.has(sessionId)) {
    const finalTranscript = latestFinalTranscript.get(sessionId);

    if (finalTranscript) {
      addToHistory(
        sessionId,
        JSON.stringify({ role: "user", parts: [{ text: finalTranscript }] })
      );
      connection.publish(
        `session:${sessionId}:transcript`,
        JSON.stringify({
          type: "user_transcript",
          transcript: finalTranscript,
        }).toString("base64")
      );

      const history = await getHistory(sessionId);

      if (history.length > 10) {
        const summary = await generateSummary(history.slice(0, -WINDOW_SIZE));
        await saveSummary(sessionId, summary);
      }

      const summarizeHistory = (await getWindowedHistory(sessionId)) || history;
      interviewQueue.add("generate_response", {
        sessionId,
        history: summarizeHistory,
        instructions
      });
    }

    // CRITICAL: Clean up the state for this turn to prevent duplicate processing.
    latestFinalTranscript.delete(sessionId);
    turnHasEnded.delete(sessionId);
    const stream = activeSttStreams.get(sessionId);
    if (stream) {
      stream.end();
    }
  }
}

export const sttPipeline = async (data) => {
  const sessionId = data?.sessionId;
  const audioChunk = Buffer.from(data?.audioData, "base64");
  const instructions = data?.instructions;

  if (!activeSttStreams.has(sessionId)) {
    turnHasEnded.set(sessionId, false);
    latestFinalTranscript.delete(sessionId);

    const newStream = createRecognitionStream(
      // Callback #1: onTranscription - Fires whenever Google sends a transcript update.
      (result) => {
        connection.publish(
          `session:${sessionId}:transcript`,
          JSON.stringify({
            type: "provisional_transcript",
            transcript: result.transcript,
          }).toString("base64")
        );
        if (result.isFinal) {
          // 1. Store the result of the "transcript received" event.
          const fullTranscript = latestFinalTranscript.get(sessionId)
            ? latestFinalTranscript.get(sessionId).concat(result.transcript)
            : result.transcript;
          latestFinalTranscript.set(sessionId, fullTranscript);
          // 2. Attempt to process. This will only succeed if the timer has already fired.
          tryProcessFinalTranscript(sessionId,instructions);
        }
      },
      // Callback #2: onError - Handles any errors from the Google STT stream.
      (error) => {
        activeSttStreams.delete(sessionId);
      },
      // Callback #3: onEnd - Fires when the stream is gracefully closed.
      () => {
        activeSttStreams.delete(sessionId);
      }
    );
    activeSttStreams.set(sessionId, newStream);
  }

  // Write the incoming audio chunk to the currently active stream.
  const currentStream = activeSttStreams.get(sessionId);
  if (currentStream && !currentStream.destroyed) {
    currentStream.write(audioChunk);
  }

  // Reset the inactivity timer every time a new audio chunk arrives.
  if (inactivityTimers.has(sessionId)) {
    clearTimeout(inactivityTimers.get(sessionId));
  }

  const newTimer = setTimeout(() => {
    const streamToEnd = activeSttStreams.get(sessionId);

    if (streamToEnd) {
      // 1. Store the result of the "timer fired" event.
      turnHasEnded.set(sessionId, true);
      // 2. Gracefully end the stream, which will prompt a final `isFinal` result from Google.
      streamToEnd.end();
      // 3. Attempt to process. This will only succeed if a final transcript has already arrived.
      tryProcessFinalTranscript(sessionId,instructions);
    }
    inactivityTimers.delete(sessionId); // Clean up the timer.
  }, INACTIVITY_TIMEOUT_MS);

  inactivityTimers.set(sessionId, newTimer);
};
