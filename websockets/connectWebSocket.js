import { URL } from "node:url";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { interviewQueue } from "../config/bullMq.js";
import { addSession, removeSession } from "../websockets/sessionManager.js";
import { sttPipeline } from "../services/sttPipeline.js";
import { getInstructions } from "../utils/MockInterview/sytemInstructions/index.js";

export const connectWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const interviewId = parsedUrl.searchParams.get("interviewId");

    const sessionId = uuidv4();

    addSession(sessionId, ws);

    const instructions = await getInstructions(interviewId);

    ws.send(JSON.stringify({ type: "session_ready", sessionId }));
    ws.send(
      JSON.stringify({
        type: "ai_transcript_fragment",
        fragment: `Hello, I’m your Interviewer for today’s mock session. Thank you for joining. Before we begin, let's discuss the interview process, or shall we get started?`,
      })
    );

    await interviewQueue.add("start_interview", {
      sessionId,
      text: `Hello, I’m your Interviewer for today’s mock session. Thank you for joining. Before we begin, let's discuss the interview process, or shall we get started?`,
    });
    z;
    ws.on("message", async (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "end_user_speech") {
          await interviewQueue.add("end_user_speech", { sessionId });
          return;
        }
        if (parsed.type === "user_not_responding") {
          await interviewQueue.add("user_not_responding", {
            sessionId,
            nudgeLevel: parsed?.nudgeLevel,
          });
          return;
        }
        if (parsed.type === "end_interview") {
          const duration = parsed?.timer;
          await interviewQueue.add("end_interview", {
            sessionId,
            interviewId,
            duration,
          });
          ws.send(JSON.stringify({ type: "interview_ended" }));
          console.log("INSIDE END");
          setTimeout(() => ws.close(), 500);
          return;
        }
      } catch (e) {
        sttPipeline({ sessionId, audioData: message, instructions });
      }
    });

    ws.on("close", () => removeSession(sessionId));
    ws.on("error", (err) => {
      console.error(`WebSocket error for session ${sessionId}:`, err.message);
      ws.terminate();
      removeSession(sessionId);
    });
  });
};
