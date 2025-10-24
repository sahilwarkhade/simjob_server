import { z } from "zod";
import OATestSection from "../../models/OATestSection.model.js";
import OATest from "../../models/OATest.model.js";
import { geminiApiForTextGeneration } from "../../utils/AI/geminiApiForTextGeneration.js";
import mongoose from "mongoose";
import DSAQuestions from "../../models/DSAQuestions.model.js";
import { generateCompanySpecificSections } from "../../aiPrompts/oaTestPrompts/generateCompanySpecificSections.js";
import { generateStoryForDsaProblem } from "../../aiPrompts/oaTestPrompts/generateStoryForDsaProblem.js";
import { generatePracticeTestSections } from "../../aiPrompts/oaTestPrompts/generatePracticeTestSections.js";
import { loadTestCases } from "../../utils/OATest/loadTestCases.js";
import { contructSubmissionPayload } from "../../utils/OATest/contructSubmissionPayload.js";
import { evaluateCode } from "../../utils/OATest/evaluateCode.js";
import Submission from "../../models/Submission.model.js";
import SectionResult from "../../models/SectionResult.model.js";
import { feedbackQueue } from "../../config/bullMq.js";

import {
  generateCompanySpecificTestSchema,
  generatePracticeTestSchema,
  runCodeSchema,
  submitAnswerSchema,
  submitSectionSchema,
  submitTestSchema,
} from "../../validators/oaTestValidators.js";

// DONE
export const getSections = async (req, res) => {
  try {
    const { testId } = req.params;
    const { userId } = req.user;
    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request",
      });
    }

    const oaTest = await OATest.findById(testId)
      .select("sections status user")
      .populate("sections")
      .exec();

    if (oaTest.user.toString() !== userId.toString()) {
      return res.status(401).json({
        success: false,
        message: "You are not the owner of this test",
      });
    }

    if (!oaTest) {
      return res.status(404).json({
        success: false,
        message: `No OA Test found with ID: ${testId}.`,
      });
    }

    if (oaTest?.status === "submitted") {
      return res.status(400).json({
        success: false,
        message:
          "You have already submitted this test you can't again give this test",
      });
    }
    return res.status(200).json({
      success: true,
      message: "OA Test sections retrieved successfully.",
      sections: oaTest.sections,
    });
  } catch (error) {
    console.error("Error in getSections controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving test sections. Please try again later.",
    });
  }
};

// DONE
export const getQuestion = async (req, res) => {
  try {
    const { testId, sectionId, questionId } = req.params;

    if (!testId || !sectionId || !questionId) {
      return res.status(400).json({
        success: false,
        message:
          "All parameters (Test ID, Section ID, Question ID) are required.",
      });
    }

    const section = await OATestSection.findById(sectionId)
      .select("questions")
      .lean();

    if (!section) {
      return res.status(404).json({
        success: false,
        message: `Section with ID: ${sectionId} not found.`,
      });
    }

    if (!section.questions || section.questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found within section with ID: ${sectionId}.`,
      });
    }

    const question = section?.questions.find(
      (q) => q?._id.toString() === questionId
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: `Question with ID: ${questionId} not found in section ${sectionId}.`,
      });
    }

    const dsaQuestion = await DSAQuestions.findOne({
      slug: question?.slug,
    }).lean();

    if (!dsaQuestion) {
      return res.status(404).json({
        success: false,
        message: `Question with ID: ${questionId} not found in section ${sectionId}.`,
      });
    }

    const response = {
      title: question?.title,
      description: question?.description,
      examples: dsaQuestion?.examples,
      constraints: dsaQuestion?.constraints,
      boilerplateCode: dsaQuestion?.boilerplateCode,
      problemId: dsaQuestion?._id,
    };

    return res.status(200).json({
      success: true,
      message: "Question retrieved successfully.",
      question: response,
    });
  } catch (error) {
    console.error("Error in getQuestion controller:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for one of the parameters: ${error.path}.`,
      });
    }
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving the question. Please try again later.",
    });
  }
};

// DONE
export const getSectionQuestions = async (req, res) => {
  try {
    const { testId, sectionId } = req.params;

    if (!testId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Test ID and Section ID are required.",
      });
    }

    const section = await OATestSection.findById(sectionId)
      .select("-questions.correctOptions -_id")
      .lean();

    if (!section) {
      return res.status(404).json({
        success: false,
        message: `Section with ID: ${sectionId} not found.`,
      });
    }

    if (!section?.questions || section?.questions?.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No questions found within section with ID: ${sectionId}.`,
        questions: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Questions for section retrieved successfully.",
      type: section?.type,
      noOfQuestions: section?.noOfQuestions,
      questions: section?.questions,
    });
  } catch (error) {
    console.error("Error in getSectionQuestions controller:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for one of the parameters: ${error.path}.`,
      });
    }
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving section questions. Please try again later.",
    });
  }
};

// DONE
export const runUserCode = async (req, res) => {
  try {
    const validatedBody = runCodeSchema.parse(req.body);
    const { languageId, sourceCode, id } = validatedBody;

    const question = await DSAQuestions.findById(id).select("testCases").lean();
    if (!question || !question.testCases?.visibleTestCases) {
      return res.status(404).json({
        success: false,
        message: "Question or its test cases not found.",
      });
    }

    const actualTestCases = await loadTestCases(
      question.testCases.visibleTestCases
    );
    const submissionPayload = contructSubmissionPayload(
      actualTestCases,
      sourceCode,
      languageId
    );
    const results = await evaluateCode(submissionPayload);

    const response = [];
    let overallStatus = true;
    let compilationError = null;
    let passedTestCases = 0;

    results.forEach((result, index) => {
      const resultObj = {};
      const status = result.status.description;

      if (status === "Accepted") {
        passedTestCases++;
      } else {
        overallStatus = false;
      }

      const testCase = actualTestCases[index];
      const stdout = result.stdout
        ? Buffer.from(result.stdout, "base64").toString("utf-8").trim()
        : null;

      resultObj.status = status;
      resultObj.input = testCase.input;
      resultObj.expected = testCase.expectedOutput;
      resultObj.output = stdout;

      if (status === "Compilation Error" && result.compile_output) {
        compilationError = Buffer.from(
          result.compile_output,
          "base64"
        ).toString("utf-8");
      }

      if (result.stderr) {
        resultObj.stderr = Buffer.from(result.stderr, "base64").toString(
          "utf-8"
        );
      }

      response.push(resultObj);
    });

    return res.status(200).json({
      success: true,
      overallStatus,
      compilationError,
      passedTestCases,
      totalTestCases: actualTestCases.length,
      response,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("ERROR IN EVALUATING USER CODE:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while evaluating the code. Please try again later.",
    });
  }
};

// DONE
export const runUserCodeForAllTestCases = async (req, res) => {
  try {
    const validatedBody = runCodeSchema.parse(req.body);
    const { languageId, sourceCode, id } = validatedBody;
    const testCases = await DSAQuestions.findById(id)
      .select("testCases -_id")
      .lean();

    const visibleTestCases = testCases?.testCases?.visibleTestCases;
    const hiddenTestCases = testCases?.testCases?.hiddenTestCases;

    const allTestCases = await loadTestCases([
      ...visibleTestCases,
      ...hiddenTestCases,
    ]);

    const submissionPayload = contructSubmissionPayload(
      allTestCases,
      sourceCode,
      languageId
    );

    const results = await evaluateCode(submissionPayload);

    const response = [];
    let overallStatus = true;
    let compilationError = null;
    let passedTestCases = 0;
    results.forEach((result, index) => {
      const resultObj = {};
      const status = result.status.description;
      passedTestCases++;
      if (status !== "Accepted") {
        passedTestCases--;
        overallStatus = false;
      }

      const testCase = allTestCases[index];

      const stdout = result.stdout
        ? Buffer.from(result.stdout, "base64").toString("utf-8").trim()
        : "N/A";

      resultObj.status = status;
      resultObj.expected = testCase.expectedOutput;
      resultObj.output = stdout;

      if (status === "Compilation Error") {
        compilationError = result?.compile_output;
      }

      if (result.stderr) {
        resultObj.stderr = result.stderr;
      }

      response.push(resultObj);
    });

    return res.status(200).json({
      success: true,
      overallStatus,
      compilationError,
      passedTestCases,
      response,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("ERROR IN EVALUATING USER CODE:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while evaluating the code. Please try again later.",
    });
  }
};

// DONE
export const submitAnswer = async (req, res) => {
  try {
    const validatedBody = submitAnswerSchema.parse(req.body);
    const {
      sectionId,
      questionId,
      problemId,
      programmingLanguage,
      sourceCode,
      languageId,
    } = validatedBody;

    let evaluationResults;
    let passedTestCases = 0;
    let totalTestCases = 0;
    let overallStatus = true;
    let error = null;

    try {
      const questionData = await DSAQuestions.findById(problemId)
        .select("testCases")
        .lean();
      if (!questionData?.testCases) {
        return res.status(404).json({
          success: false,
          message: "Problem or its test cases not found.",
        });
      }

      const visible = questionData.testCases.visibleTestCases || [];
      const hidden = questionData.testCases.hiddenTestCases || [];
      const allTestCases = await loadTestCases([...visible, ...hidden]);
      totalTestCases = allTestCases.length;

      if (totalTestCases === 0) {
        throw new Error("No test cases found for this problem.");
      }

      const submissionPayload = contructSubmissionPayload(
        allTestCases,
        sourceCode,
        languageId
      );
      evaluationResults = await evaluateCode(submissionPayload);

      evaluationResults.forEach((result) => {
        const status = result.status.description;
        if (status === "Accepted") {
          passedTestCases++;
        } else {
          overallStatus = false;
        }

        if (status === "Compilation Error" && result.compile_output) {
          error = Buffer.from(result.compile_output, "base64").toString(
            "utf-8"
          );
        } else if (result.stderr) {
          error = Buffer.from(result.stderr, "base64").toString("utf-8");
        }
      });
    } catch (evalError) {
      console.error("ERROR IN CODE EVALUATION STAGE ::", evalError);
      return res.status(503).json({
        success: false,
        message: "Code evaluation service failed. Please try again later.",
      });
    }

    const mongoSession = await mongoose.startSession();
    try {
      mongoSession.startTransaction();

      const newSubmission = new Submission({
        questionId,
        code: sourceCode,
        programmingLanguage,
        passedTestCasesCount: passedTestCases,
        allTestCasesCount: totalTestCases,
        error,
        overallStatus,
      });
      await newSubmission.save({ session: mongoSession });

      const section = await OATestSection.findById(sectionId).session(
        mongoSession
      );
      if (!section) throw new Error("Section not found.");

      const question = section.questions.id(questionId);
      if (!question)
        throw new Error("Question not found in the specified section.");

      question.submission = newSubmission._id;
      await section.save({ session: mongoSession });

      await mongoSession.commitTransaction();

      return res.status(201).json({
        success: true,
        message: "Code evaluated & submitted successfully.",
        data: { passedTestCases, totalTestCases, overallStatus, error },
      });
    } catch (dbError) {
      await mongoSession.abortTransaction();
      console.error("ERROR IN SAVING SUBMISSION STAGE ::", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to save submission. Please try again later.",
      });
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("UNEXPECTED ERROR IN SUBMIT ANSWER ::", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
};

// DONE
export const submitSection = async (req, res) => {
  try {
    const { sectionId, userAnswer } = submitSectionSchema.parse(req.body);

    const section = await OATestSection.findById(sectionId);
    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found." });
    }

    const questions = section.questions.sort((a, b) =>
      a._id.toString().localeCompare(b._id.toString())
    );

    let correctQuestions = [];
    let incorrectQuestions = [];
    let unansweredQuestions = [];
    let score = 0;

    questions.forEach((q) => {
      if (Array.isArray(q.correctOptions)) {
        q.correctOptions.sort();
      }
    });

    for (const question of questions) {
      const qId = question._id.toString();
      const submittedAnswer = userAnswer[qId];

      if (submittedAnswer === undefined) {
        unansweredQuestions.push(question.description || `Question ${qId}`);
        continue;
      }

      let isCorrect = false;
      const dbCorrectOptions = question.correctOptions;

      if (Array.isArray(submittedAnswer)) {
        const sortedUserOptions = [...submittedAnswer].sort();
        isCorrect =
          dbCorrectOptions.length === sortedUserOptions.length &&
          sortedUserOptions.every((opt, idx) => opt === dbCorrectOptions[idx]);
      } else {
        isCorrect =
          dbCorrectOptions.length === 1 &&
          dbCorrectOptions[0] === submittedAnswer;
      }

      if (isCorrect) {
        correctQuestions.push(question.description || `Question ${qId}`);
        score++;
      } else {
        incorrectQuestions.push(question.description || `Question ${qId}`);
      }
    }

    const mongoSession = await mongoose.startSession();
    try {
      mongoSession.startTransaction();
      const sectionResult = new SectionResult({
        sectionId: sectionId,
        totalAnsweredQuestion:
          correctQuestions.length + incorrectQuestions.length,
        correctQuestions,
        incorrectQuestions,
        score,
        unansweredQuestions,
      });
      await sectionResult.save({ session: mongoSession });

      section.result = sectionResult._id;
      await section.save({ session: mongoSession });

      await mongoSession.commitTransaction();
    } catch (dbError) {
      await mongoSession.abortTransaction();
      console.log(
        "ERROR IN DB TRANSACTION DURING SECTION SUBMISSION :: ",
        dbError
      );
      return res.status(500).json({
        success: false,
        message: "Failed to save the results. Please try again.",
      });
    } finally {
      await mongoSession.endSession();
    }

    return res.status(200).json({
      success: true,
      message: "Section submitted successfully.",
      score,
      correctQuestions,
      incorrectQuestions,
      unansweredQuestions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("Error submitting section answer :: ", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
};

// DONE
export const submitTest = async (req, res) => {
  try {
    const { testId } = submitTestSchema.parse(req.body);
    const { userId } = req.user;

    const updatedTest = await OATest.findByIdAndUpdate(
      testId,
      { $set: { status: "submitted" } },
      { new: true }
    );

    if (!updatedTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    await feedbackQueue.add(
      "oaTest-feedback",
      { testId, userId },
      { jobId: `OA-Test-Feedback-${testId}` }
    );

    return res.status(200).json({
      success: true,
      message:
        "Test submitted successfully. Your results will be processed shortly.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("Error in submitting test ::", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred. Please try again later.",
    });
  }
};

// DONE
export const generateCompanySpecificTest = async (req, res) => {
  try {
    const { testCategory, companyName, role, experienceLevel } =
      generateCompanySpecificTestSchema.parse(req.body);
    const { userId } = req.user;
    let llmResponse;
    try {
      let prompt = generateCompanySpecificSections(
        companyName,
        role,
        experienceLevel
      );
      llmResponse = await geminiApiForTextGeneration(prompt);
    } catch (error) {
      console.log("ERROR IN GENERATING COMPANY SPECIFIC TEST 1 :: ", error);
      return res.status(503).json({
        success: false,
        message: "Unable to generate test, try again later",
      });
    }
    try {
      let dsaSection;
      if (llmResponse.sectionList.includes("Data Structures and Algorithms")) {
        const dsaQuestion = await DSAQuestions.find({})
          .select("title description slug -_id")
          .skip(2)
          .limit(2)
          .lean();
        let prompt = generateStoryForDsaProblem(
          companyName,
          JSON.stringify(dsaQuestion)
        );
        dsaSection = await geminiApiForTextGeneration(prompt);

        const section = llmResponse?.sections.find(
          (section) => section.name === "Data Structures and Algorithms"
        );

        section.questions = dsaSection;
        section.noOfQuestions = section.questions.length;
      }
    } catch (error) {
      console.log("ERROR IN GENERATING COMPANY SPECIFIC TEST 2 :: ", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error comes, please try again later",
      });
    }
    // creating mongoDB Transaction and then starting it
    // const mongoSession = await mongoose.startSession();
    // mongoSession.startTransaction();
    try {
      const test = new OATest({
        user: userId,
        testCategory,
        companyName,
        role,
        experienceLevel,
        sections: [],
      });
      if (llmResponse?.sections.length > 0) {
        const sectionPromises = llmResponse?.sections?.map(
          async (sectionData) => {
            if (sectionData?.questions.length > 0) {
              const newSection = new OATestSection(sectionData);
              await newSection.save();//{ session: mongoSession }
              return newSection;
            }
          }
        );

        const createdSections = await Promise.all(sectionPromises);
        createdSections.forEach((section) => {
          if (section) test.sections.push(section._id);
        });
      }

      await test.save();//{ session: mongoSession }

      // await mongoSession.commitTransaction();

      return res.status(201).json({
        success: true,
        message: "Test created successfully.",
        testID: test._id,
      });
    } catch (error) {
      // await mongoSession.abortTransaction();
      console.error("Error in generateCompanySpecificTest controller:", error);
      return res.status(500).json({
        success: false,
        message:
          "An unexpected error occurred while generating the test. Please try again later.",
      });
    } finally {
      // await mongoSession.endSession();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("UNEXPECTED ERROR in generateCompanySpecificTest ::", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
};

// DONE
export const generatePracticeTest = async (req, res) => {
  try {
    const validatedBody = generatePracticeTestSchema.parse(req.body);
    let {
      testCategory,
      difficulty,
      userSelectedSections,
      specialInstructions,
    } = validatedBody;
    const { userId } = req.user;

    let isDsaSectionPresent = false;
    let llmResponse;
    try {
      if (userSelectedSections.includes("dsa")) {
        isDsaSectionPresent = true;
        userSelectedSections = userSelectedSections.filter(
          (section) => section !== "dsa"
        );
      }

      const prompt = generatePracticeTestSections(
        difficulty,
        JSON.stringify(userSelectedSections)
      );
      llmResponse = await geminiApiForTextGeneration(prompt, "gemini-2.5-pro");
    } catch (error) {
      console.log("ERROR IN GENERATING PRACTICE TEST 1 :: ", error);
      return res.status(503).json({
        success: false,
        message: "Unable to generate test, try again later",
      });
    }

    if (isDsaSectionPresent) {
      try {
        const dsaQuestion = await DSAQuestions.find({})
          .select("title description slug -_id")
          .limit(3)
          .lean();

        let prompt = generateStoryForDsaProblem(
          "",
          JSON.stringify(dsaQuestion)
        );
        let dsaSection = await geminiApiForTextGeneration(
          prompt,
          "gemini-2.5-pro"
        );

        const newSection = {
          name: "Data Structures and Algorithms",
          type: "coding",
          noOfQuestions: dsaSection.length,
          questions: [...dsaSection],
        };
        llmResponse?.sections.push(newSection);
      } catch (error) {
        console.log("ERROR IN GENERATING PRACTICE TEST 2 :: ", error);
        return res.status(500).json({
          success: false,
          message: "An unexpected error comes, please try again later",
        });
      }

      // const mongoSession = await mongoose.startSession();

      try {
        const test = new OATest({
          user: userId,
          testCategory,
          difficulty,
          userSelectedSections,
          specialInstructions: specialInstructions || "",
          sections: [],
        });
        
        // mongoSession.startTransaction();
        if (llmResponse?.sections.length > 0) {
          const sectionPromises = llmResponse?.sections.map(
            async (sectionData) => {
              if (sectionData?.questions.length > 0) {
                const newSection = new OATestSection(sectionData);
                await newSection.save();//{ session: mongoSession }
                return newSection;
              }
            }
          );

          const createdSections = await Promise.all(sectionPromises);
          createdSections.forEach((section) => {
            if (section) test.sections.push(section._id);
          });
        }

        await test.save(); //{ session: mongoSession }

        // await mongoSession.commitTransaction();

        return res.status(201).json({
          success: true,
          message: "Test created successfully.",
          testID: test._id,
        });
      } catch (error) {
        // await mongoSession.abortTransaction();
        console.error(
          "Error in generateCompanySpecificTest controller:",
          error
        );
        return res.status(500).json({
          success: false,
          message:
            "An unexpected error occurred while generating the test. Please try again later.",
        });
      } finally {
        // await mongoSession.endSession();
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("UNEXPECTED ERROR in generatePracticeTest ::", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
};

// DONE
export const getFeedback = async (req, res) => {
  const { testId } = req.params;

  if (!testId) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid TestID",
    });
  }

  try {
    const test = await OATest.findById(testId).select("feedback score").lean();

    if (test?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Invalid request, first submit test",
      });
    }
    if (!test.feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found, might be in generation phase",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback got successfully",
      feedback: test?.feedback,
    });
  } catch (error) {
    console.log("ERROR IN GETTING FEEDBACK FOR OA TEST :: ", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error comes, please check after some time",
    });
  }
};
