import express from "express";
import {
  analysisAnswer,
  askQuestions,
  generateFeedback,
  startMockInterview,
} from "../controllers/MockInterviewControllers/MockInterview.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../config/multerFileUpload.js";
const router = express.Router();

router.post("/mock-interview", auth, startMockInterview);
router.post("/mock-interview/analysis-answer/:mockInterviewId/:questionId", upload.single('answerFile'),analysisAnswer);
router.post("/mock-interview/:mockInterviewId/feedback",generateFeedback);
router.get("/mock-interview/:mockInterviewId/:questionId", askQuestions);
router.get("/mock-interview/:mockInterviewId", askQuestions);

export default router;
