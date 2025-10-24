import express from "express";
import {
  generateCompanySpecificTest,
  generatePracticeTest,
  getFeedback,
  getQuestion,
  getSectionQuestions,
  getSections,
  runUserCode,
  runUserCodeForAllTestCases,
  submitAnswer,
  submitSection,
  submitTest,
} from "../controllers/OATestControllers/OATest.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate/companyspecific", auth, generateCompanySpecificTest);
router.post("/generate/practice", auth, generatePracticeTest);
router.get(
  "/:testId/sections/:sectionId/question/:questionId",
  auth,
  getQuestion
);
router.get("/:testId/sections/:sectionId/questions", auth, getSectionQuestions);
router.get("/:testId/sections", auth, getSections);
router.post("/run/usercode", auth, runUserCode);
router.post("/run/all/testcases", auth, runUserCodeForAllTestCases);
router.post("/submit/code", auth, submitAnswer);
router.post("/submit/section", auth, submitSection);
router.post("/submit/test", auth, submitTest);
router.get("/feedback/:testId", auth, getFeedback);

export default router;
