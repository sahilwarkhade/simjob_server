import express from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  createCompanySpecificMockInterview,
  createSkillBasedMockInterview,
  getFeedback,
} from "../controllers/MockInterviewControllers/MockInterview.controller.js";
const router = express.Router();

router.post("/companyspecific", auth, createCompanySpecificMockInterview);
router.post("/skillbased", auth, createSkillBasedMockInterview);
router.get("/feedback/:interviewId", auth, getFeedback);

export default router;
