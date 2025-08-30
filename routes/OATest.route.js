import express from "express";
import {
  generateCompanySpecificTest,
  generatePracticeTest,
  getQuestion,
  getSectionQuestions,
  getSections,
  submitAnswer,
  submitSection,
  submitTest,
} from "../controllers/OATestControllers/OATest.controller.js";
import  auth  from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate/companyspecific", auth, generateCompanySpecificTest);
router.post("/generate/practice", auth, generatePracticeTest);
router.post("/submit-test", auth, submitTest);
router.post("/submit-answer", auth, submitAnswer);
router.post("/submit-section", auth, submitSection);
router.get("/:testId/sections/:sectionId/question/:questionId", auth, getQuestion);
router.get("/:testId/sections/:sectionId/questions", auth, getSectionQuestions);
router.get("/:testId/sections", auth, getSections);


export default router;