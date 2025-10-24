import { Worker } from "bullmq";
import { SEND_EMAIL_QUEUE } from "../config/bullMq.js";
import { mailSender } from "../utils/SendEmail/index.js";
import { connection } from "../config/redis.js";

const worker = new Worker(
  SEND_EMAIL_QUEUE,
  async (job) => {
    try {
      const { email, title, template } = job.data;
      await mailSender(email, title, template);
    } catch (error) {
      console.log("ERROR IN SEND EMAIL WORKER :: ", error);
      throw error;
    }
  },
  {
    connection: connection,
    concurrency: 4,
    stalledInterval: 15000,
    limiter: { max: 5, duration: 1500 },
  }
);

worker.on('ready',()=>{
    console.log("READY TO SEND EMAIL")
})