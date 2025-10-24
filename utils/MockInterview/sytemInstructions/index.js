import { connection as redis } from "../../../config/redis.js";

const INSTRUCTION_PREFIX = "systemInstruction:";
const INSTRUCTION_TTL = 60 * 60 * 24; 

export const addInstructions = async (interviewId, systemInstruction) => {
  try {
    const value =
      typeof systemInstruction === "object"
        ? JSON.stringify(systemInstruction)
        : systemInstruction;
    await redis.set(
      `${INSTRUCTION_PREFIX}${interviewId}`,
      value,
      "EX",
      INSTRUCTION_TTL
    );
  } catch (err) {
    console.error("Redis addInstructions error:", err);
  }
};

export const getInstructions = async (interviewId) => {
  try {
    const response = await redis.get(`${INSTRUCTION_PREFIX}${interviewId}`);
    return response;
  } catch {
    return null;
  }
};

export const deleteInstructions = async (interviewId) => {
  try {
    await redis.del(`${INSTRUCTION_PREFIX}${interviewId}`);
  } catch (err) {
    console.error("Redis deleteInstructions error:", err);
  }
};
