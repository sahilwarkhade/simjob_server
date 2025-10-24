import { subscriber } from "../config/redis.js";

const activeSessions = new Map();

export const addSession = (sessionId, ws) => {
  activeSessions.set(sessionId, ws);
  const channelForAudio = `session:${sessionId}:audio`;
  subscriber.subscribe(channelForAudio, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${channelForAudio}`, err);
      ws.close();
    } else {
      console.log(`Subscribed to Redis channel: ${channelForAudio}`);
    }
  });
  const channelForTranscript = `session:${sessionId}:transcript`;
  subscriber.subscribe(channelForTranscript, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${channelForTranscript}`, err);
      ws.close();
    } else {
      console.log(`Subscribed to Redis channel: ${channelForTranscript}`);
    }
  });
};

export const removeSession = (sessionId) => {
  const channel = `session:${sessionId}:audio`;
  subscriber.unsubscribe(channel);
  activeSessions.delete(sessionId);
  console.log(`Unsubscribed and removed session: ${sessionId}`);
};


subscriber.on("message", (channel, message) => {
  const sessionId = channel.split(":")[1];
  const type = channel.split(":")[2];
  const ws = activeSessions.get(sessionId);
  if (ws && ws.readyState === ws.OPEN) {
    if (type === "audio") {
      ws.send(JSON.stringify({ type: "audio", data: message }));
    } else {
      ws.send(JSON.stringify(message));
    }
  }
});

export const sendToClient = (sessionId, data) => {
  const ws = activeSessions.get(String(sessionId));
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
};
