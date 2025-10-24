import { connection as redis } from "../config/redis.js";

const HISTORY_KEY_PREFIX = "history:";
const SUMMARY_PREFIX = "summary:";
export const WINDOW_SIZE = 4;

// fetch full history
export async function getHistory(sessionId) {
  try {
    const historyJson = await redis.lrange(
      `${HISTORY_KEY_PREFIX}${sessionId}`,
      0,
      -1
    );
    return historyJson.map((item) => JSON.parse(item));
  } catch (error) {
    console.error(`Error getting history for session ${sessionId}:`, error);
    return [];
  }
}

//add to history
export async function addToHistory(sessionId, payload) {
  try {
    const key = `${HISTORY_KEY_PREFIX}${sessionId}`;
    await redis.rpush(key, payload);
  } catch (error) {
    console.error(`Error adding to history for session ${sessionId}:`, error);
  }
}

// Fetch windowed + summarized history (for Gemini)
export async function getWindowedHistory(sessionId) {
  const key = `${HISTORY_KEY_PREFIX}${sessionId}`;
  const messages = await redis.lrange(key, -WINDOW_SIZE, -1);
  const parsedMessages = messages.map((m) => JSON.parse(m));

  // Check if we already have a summary stored
  const summaryKey = `${SUMMARY_PREFIX}${sessionId}`;
  const summary = await redis.get(summaryKey);

  if (summary) {
    return [
      { role: "system", parts: [{ text: `Summary so far: ${summary}` }] },
      ...parsedMessages,
    ];
  } else {
    return parsedMessages;
  }
}

// Save/update summary in Redis
export async function saveSummary(sessionId, summaryText) {
  const summaryKey = `${SUMMARY_PREFIX}${sessionId}`;
  await redis.set(summaryKey, summaryText);
}

// delete history
export async function deleteHistory(sessionId) {
  try {
    const results = await Promise.all([
      redis.del(`${HISTORY_KEY_PREFIX}${sessionId}`),
      redis.del(`${SUMMARY_PREFIX}${sessionId}`),
    ]);
    console.log(`Deleted history keys for session ${sessionId}:`, results);
  } catch (error) {
    console.error("ERROR IN DELETING HISTORY :: ", error);
  }
}
