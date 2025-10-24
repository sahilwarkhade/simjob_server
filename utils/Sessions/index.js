import { connection as redisClient } from "../../config/redis.js";
import crypto from "crypto";

const SESSION_TTL_SECONDS = 24 * 60 * 60;
const MAX_SESSIONS = 3;
const SESSION_PREFIX = "sess:";
const USER_SESSIONS_PREFIX = "user_sessions:";

export async function createSession(userId) {
  try {
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
  
    const allSessionIds = await redisClient.smembers(userSessionsKey);
    const sessionKeys = allSessionIds.map((id) => `${SESSION_PREFIX}${id}`);
  
    let validSessionIds = [];
    if (sessionKeys.length > 0) {
      const existingSessions = await redisClient.mget(sessionKeys);
      validSessionIds = allSessionIds.filter(
        (id, index) => existingSessions[index] !== null
      );
    }
  
    const staleSessionIds = allSessionIds.filter(
      (id) => !validSessionIds.includes(id)
    );
    if (staleSessionIds.length > 0) {
      await redisClient.srem(userSessionsKey, ...staleSessionIds);
    }
  
    if (validSessionIds.length >= MAX_SESSIONS) {
      console.log(
        `Login rejected for user ${userId}: Concurrent session limit (${MAX_SESSIONS}) reached.`
      );
      return null;
    }
  
    const newSessionId = crypto.randomBytes(32).toString("hex");
    const newSessionKey = `${SESSION_PREFIX}${newSessionId}`;
    const sessionData = JSON.stringify({ userId });
  
    const pipeline = redisClient.pipeline();
    pipeline.set(newSessionKey, sessionData, "EX", SESSION_TTL_SECONDS);
    pipeline.sadd(userSessionsKey, newSessionId);
    pipeline.expire(userSessionsKey, SESSION_TTL_SECONDS);
    await pipeline.exec();
  
    return newSessionId;
  } catch (error) {
    console.log("ERROR IN CREATING LOGIN SESSION :: ", error);
    return null;
  }
}

export async function getSession(sessionId) {
  try {
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;
    const sessionDataString = await redisClient.get(sessionKey);

    if (!sessionDataString) {
      return null;
    }

    const sessionData = JSON.parse(sessionDataString);
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${sessionData.userId}`;

    const pipeline = redisClient.pipeline();
    pipeline.expire(sessionKey, SESSION_TTL_SECONDS);
    pipeline.expire(userSessionsKey, SESSION_TTL_SECONDS);
    await pipeline.exec();

    return sessionData;
  } catch (error) {
    console.log("ERROR IN GETTING SESSION FOR LOGIN :: ", error);
    return null;
  }
}

export async function deleteSession(sessionId) {
  try {
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;

    const sessionDataString = await redisClient.get(sessionKey);
    if (!sessionDataString) return;

    const sessionData = JSON.parse(sessionDataString);
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${sessionData.userId}`;

    const pipeline = redisClient.pipeline();
    pipeline.del(sessionKey);
    pipeline.srem(userSessionsKey, sessionId);
    await pipeline.exec();
  } catch (error) {
    console.log("ERROR IN DELETING SESSSION FROM REDIS :: ", error);
    return;
  }
}


export async function invalidateAllUserSessions(userId) {
  try {
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

    const sessionIds = await redisClient.smembers(userSessionsKey);

    if (!sessionIds || sessionIds.length === 0) {
      return;
    }

    const sessionKeysToDelete = sessionIds.map(id => `${SESSION_PREFIX}${id}`);
    const keysToDelete = [userSessionsKey, ...sessionKeysToDelete];

    await redisClient.del(keysToDelete);
    
    console.log(`Invalidated ${sessionIds.length} sessions for user ${userId}.`);

  } catch (error) {
    console.log(`ERROR invalidating all sessions for user ${userId} :: `, error);
  }
}