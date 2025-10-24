import OATestSections from "../models/OATestSection.model.js";
import User from "../models/User.model.js";
import { Worker } from "bullmq";
import { emailQueue, FEEDBACK_QUEUE } from "../config/bullMq.js";
import { connection } from "../config/redis.js";
import OATest from "../models/OATest.model.js";
import Submission from "../models/Submission.model.js";
import SectionResult from "../models/SectionResult.model.js";
import { feedbackGeneration } from "../aiPrompts/oaTestPrompts/feedbackGeneration.js";
import { geminiApiForTextGeneration } from "../utils/AI/geminiApiForTextGeneration.js";
import connectDB from "../config/DB.js";
import Analytics from "../models/Analytics.model.js";
import { oaTestFeedbackTemplate } from "../templates/Email/oaTestFeedback.js";
import MockInterview from "../models/MockInterview.model.js";
import mongoose from "mongoose";
import { practiceOATestFeedbackTemplate } from "../templates/Email/oaTestFeedbackForPracticeTest.js";
import { companySpecificMockInterviewFeedback } from "../templates/Email/companySpecifcMockInterviewFeedback.js";
import { skillBasedMockInterviewFeedback } from "../templates/Email/skillBasedMockInterviewFeedbackTemplate.js";
import { skillBasedFeedback } from "../aiPrompts/mockInterview/skillBasedFeedback.js";
import { companySpecificFeedback } from "../aiPrompts/mockInterview/companySpecificFeedback.js";
import { feedbackGenerateForPractice } from "../aiPrompts/oaTestPrompts/feedbackGenerateForPractice.js";
await connectDB();

const worker = new Worker(
  FEEDBACK_QUEUE,
  async (job) => {
    try {
      switch (job.name) {
        case "oaTest-feedback":
          console.log("INSIDE JOB");
          const { testId, userId } = job.data;
          const test = await OATest.findById(testId).populate("sections user");
          if (!test) throw new Error("Test not found");

          if (test.feedback) {
            return { ok: true, reason: "already-processed" };
          }

          const testContext = buildTestContext(test);

          const allTestSections = test?.sections;
          if (allTestSections.length <= 0)
            return { ok: true, reason: "Zero test sections present" };

          const testSubmissionResult = [];
          for (const section of allTestSections) {
            const sectionInformation = {
              sectionName: section?.name,
              sectionType: section?.type,
              sectionQuestions: [],
            };
            const sectionQuestions = section?.questions;
            if (sectionInformation?.sectionType === "coding") {
              for (const question of sectionQuestions) {
                const sectionQuestionsInformation = {
                  questionTitle: question?.title,
                  questionDescription: question?.description,
                };

                if (question.submission) {
                  sectionQuestionsInformation.attempted = true;
                  const submission = await Submission.findById(
                    question.submission
                  ).lean();

                  const submissionInformation = {
                    userCode: submission?.code,
                    userChoosedProgrammingLanguage:
                      submission?.programmingLanguage,
                    allTestCasesCount: submission?.allTestCasesCount,
                    passedTestCasesCount: submission?.passedTestCasesCount,
                    error: submission?.error || "No Error",
                    overallresult: submission?.overallStatus
                      ? "Successfully Submitted"
                      : "Partially Submitted",
                  };

                  sectionQuestionsInformation.submissionInformation =
                    submissionInformation;
                } else {
                  sectionQuestionsInformation.attempted = false;
                  sectionQuestionsInformation.submissionInformation = null;
                }
                sectionInformation.sectionQuestions.push(
                  sectionQuestionsInformation
                );
              }
            } else {
              for (const question of sectionQuestions) {
                sectionInformation.sectionQuestions.push({
                  questionDescription: question?.description,
                });
              }

              if (section?.result) {
                sectionInformation.attempted = true;
                const sectionResult = await SectionResult.findById(
                  section?.result
                ).lean();

                sectionInformation.result = {};
                sectionInformation.result.correctQuestions =
                  sectionResult?.correctQuestions;
                sectionInformation.result.incorrectQuestions =
                  sectionResult?.incorrectQuestions;
                sectionInformation.result.unansweredQuestions =
                  sectionResult?.unansweredQuestions;
              } else {
                sectionInformation.attempted = false;
                sectionInformation.result = null;
              }
            }

            testSubmissionResult.push(sectionInformation);
          }

          let prompt = null;
          {
            prompt =
              testContext.type === "companyspecific"
                ? feedbackGeneration(
                    testContext,
                    JSON.stringify(testSubmissionResult)
                  )
                : feedbackGenerateForPractice(
                    testContext,
                    JSON.stringify(testSubmissionResult)
                  );
          }

          const response = await geminiApiForTextGeneration(prompt);
          console.log("RESPONSE GENERTED SUCCESSFULLY");

          const score = response?.overallScore;
          test.feedback = response;
          test.score = score;

          const analytics = await Analytics.findOne({ user: userId });
          const averageOaScore = analytics?.averageOaScore || 0;
          const totalOaTests = analytics?.totalOaTests || 0;
          const newOaTestCount = totalOaTests + 1;
          const newAverageScore =
            (averageOaScore * totalOaTests + score) / newOaTestCount;
          analytics.totalOaTests = newOaTestCount;
          analytics.averageOaScore = newAverageScore;

          const mongooseSession = await mongoose.startSession();
          try {
            mongooseSession.startTransaction();
            await analytics.save({ session: mongooseSession });
            await test.save({ session: mongooseSession });
            await mongooseSession.commitTransaction();
          } catch (error) {
            await mongooseSession.abortTransaction();
            console.log("ERROR IN SAVING TEST :: ", error);
            throw error;
          } finally {
            await mongooseSession.endSession();
          }

          let template = null;
          {
            template =
              testContext?.type === "companyspecific"
                ? oaTestFeedbackTemplate(
                    test?.user?.fullName,
                    test.companyName,
                    score,
                    response?.overallSummary,
                    testContext.role
                  )
                : practiceOATestFeedbackTemplate(
                    test?.user?.fullName,
                    test?.difficulty,
                    test.userSelectedSections,
                    score,
                    response?.overallSummary
                  );
          }

          await emailQueue.add(
            "oa-test-feedback",
            {
              email: test.user.email,
              title: "OA Test Feedback",
              template,
            },
            { jobId: `${testId}-"oa-test-feedback"` }
          );
          break;

        case "interview-feedback":
          console.log("INSIDE INTERVIEW FEEDBACK");
          const { interviewId } = job.data;
          const mockInterview = await MockInterview.findById(
            interviewId
          ).populate("user");

          if (mockInterview.feedback) {
            return { ok: true, reason: "Already processed" };
          }
          mockInterview.status = "submitted";
          const transcript = mockInterview.transcript || "";

          if (!transcript) {
            mockInterview.feedback = null;
            return { ok: true, reason: "no transcript found" };
          }

          const mockInterviewContext = buildInterviewContext(mockInterview);

          let interviewFeedbackPrompt = null;
          {
            interviewFeedbackPrompt =
              mockInterview.mockCategory === "companyspecific"
                ? companySpecificFeedback(mockInterviewContext, transcript)
                : skillBasedFeedback(mockInterviewContext, transcript);
          }

          const interviewFeedbackResponse = await geminiApiForTextGeneration(
            interviewFeedbackPrompt
          );

          console.log("RESPONSE GENERTED SUCCESSFULLY");

          const interviewScore = interviewFeedbackResponse.overallScore;
          mockInterview.feedback = interviewFeedbackResponse;
          mockInterview.score = interviewScore;

          const userAnalytics = await Analytics.findOne({
            user: mockInterview?.user,
          });

          const averageMockScore = userAnalytics?.averageMockScore || 0;
          const totalMockTests = userAnalytics?.totalMockInterviews || 0;
          const newMockTestCount = totalMockTests + 1;
          const newAverageMockScore =
            (averageMockScore * totalMockTests + interviewScore) /
            newMockTestCount;
          userAnalytics.totalMockInterviews = newMockTestCount;
          userAnalytics.averageMockScore = newAverageMockScore;

          const mongoSession = await mongoose.startSession();

          try {
            mongoSession.startTransaction();
            await userAnalytics.save({ session: mongoSession });
            await mockInterview.save({ session: mongoSession });
            await mongoSession.commitTransaction();
          } catch (error) {
            await mongoSession.abortTransaction();
            console.log("ERROR IN SAVING MOCKINTERVIEW :: ", error);
            throw error;
          } finally {
            await mongoSession.endSession();
          }

          let interviewTemplate = null;
          {
            interviewTemplate =
              mockInterview.mockCategory === "companyspecific"
                ? companySpecificMockInterviewFeedback(
                    mockInterview.user.fullName,
                    mockInterview.companyName,
                    mockInterview.role,
                    mockInterview.experienceLevel,
                    interviewScore,
                    interviewFeedbackResponse.overallSummary
                  )
                : skillBasedMockInterviewFeedback(
                    mockInterview.user.fullName,
                    mockInterview.skills,
                    mockInterview.difficultyLevel,
                    mockInterview.experienceLevel,
                    interviewScore,
                    interviewFeedbackResponse.overallSummary
                  );
          }
          console.log(mockInterview.user.email);
          await emailQueue.add(
            "interview-feedback",
            {
              email: mockInterview.user.email,
              title: "Mock Interview Feedback",
              template: interviewTemplate,
            },
            { jobId: `${interviewId}-"oa-test-feedback"` }
          );
          break;
      }
    } catch (error) {
      console.log(`Feedback worker with JobId : ${job.id} failed`, error);
      throw error;
    }
  },
  {
    connection: connection,
    concurrency: 2,
    stalledInterval: 15000,
    limiter: { max: 2, duration: 1500 },
  }
);

worker.on("ready", () => {
  console.log("READY TO PROVIDE FEEDBACK");
});

function buildTestContext(test) {
  const testContext =
    test?.testCategory === "companyspecific"
      ? {
          type: "companyspecific",
          company: test?.companyName,
          role: test?.role,
          experienceLevel: test?.experienceLevel,
        }
      : {
          type: "practice",
          difficulty: test?.difficulty,
          userSelectedSections: [...test?.userSelectedSections],
        };

  return testContext;
}

function buildInterviewContext(mockInterview) {
  const context =
    mockInterview.mockCategory === "companyspecific"
      ? {
          mockCategory: mockInterview.mockCategory,
          companyName: mockInterview.companyName,
          role: mockInterview.role,
          experienceLevel: mockInterview?.experienceLevel,
        }
      : {
          mockCategory: mockInterview.mockCategory,
          skills: mockInterview.skills,
          difficulty: mockInterview.difficultyLevel,
          experienceLevel: mockInterview?.experienceLevel,
        };
  return context;
}
