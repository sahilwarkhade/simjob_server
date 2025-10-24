import { Queue } from "bullmq";
import { connection } from "./redis.js";

export const INTERVIEW_QUEUE_NAME = "interview-processing";
export const FEEDBACK_QUEUE = "feedback-processing";
export const SEND_EMAIL_QUEUE = "email-sending";

export const interviewQueue = new Queue(INTERVIEW_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600,
    },
    removeOnFail: {
      age: 86400,
    },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    lifo: false,
  },
});

export const feedbackQueue = new Queue(FEEDBACK_QUEUE, {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000 * 60 * 60 * 2,
    },
    removeOnComplete: true,
    removeOnFail: {
      age: 86400,
    },
  },
  connection,
});

export const emailQueue = new Queue(SEND_EMAIL_QUEUE, {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000 * 60 * 60 * 3,
    },
    removeOnComplete: true,
    removeOnFail: {
      age: 86400,
    },
  },
  connection,
});
