import OATestSection from "../../models/OATestSection.model.js";
import OATest from "../../models/OATest.model.js";
import { generateCompanySpecificTestSections } from "../../aiPrompts/generateCompanySpecificTest.js";
import { geminiApiForTextGeneration } from "../../utils/AI/geminiApiForTextGeneration.js";
import { generatePracticeQuestionForOATest } from "../../aiPrompts/generatePracticeQuestionForOATest.js";
import { oaTestFeedback } from "../../aiPrompts/oaTestFeedback.js";
import Analytics from "../../models/Analytics.model.js";
import mongoose from "mongoose";

export const generateCompanySpecificTest = async (req, res) => {
  const { userId } = req.user;
  const {
    oaCategory,
    company,
    role,
    experienceLevel,
    selectedSections,
    instructions,
    preferredProgrammingLanguages,
  } = req.body;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    if (
      !oaCategory ||
      !company ||
      !role ||
      !experienceLevel ||
      !preferredProgrammingLanguages ||
      preferredProgrammingLanguages.length === 0
    ) {
      console.log({
        oaCategory,
        company,
        role,
        experienceLevel,
        preferredProgrammingLanguages,
      });
      return res.status(400).json({
        success: false,
        message: `Required fields ${
          oaCategory ||
          company ||
          role ||
          experienceLevel ||
          preferredProgrammingLanguages
        } are missing.`,
      });
    }

    const prompt = generateCompanySpecificTestSections(
      company,
      role,
      experienceLevel,
      preferredProgrammingLanguages,
      selectedSections,
      instructions
    );

    let llmResponse = await geminiApiForTextGeneration(prompt);

    const test = new OATest({
      user: userId,
      oaCategory,
      company,
      role,
      experienceLevel,
      userSelectedSections: selectedSections || [],
      specialInstructions: instructions || null,
      preferredProgrammingLanguages: [...preferredProgrammingLanguages],
      sections: [],
    });

    if (llmResponse.length > 0) {
      const sectionPromises = llmResponse.map(async (sectionData) => {
        console.log("SECTION DATA ::: ", sectionData);
        const newSection = await OATestSection.create([sectionData], {
          session: mongoSession,
        });

        return newSection[0];
      });

      const createdSections = await Promise.all(sectionPromises);
      createdSections.forEach((section) => {
        if (section) test.sections.push(section._id);
      });
    }

    await test.save({ session: mongoSession });

    await mongoSession.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Test created successfully.",
      testID: test._id,
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.error("Error in generateCompanySpecificTest controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while generating the test. Please try again later.",
    });
  } finally {
    await mongoSession.endSession();
  }
};

export const generatePracticeTest = async (req, res) => {
  const { userId } = req.user;
  const {
    oaCategory,
    role,
    difficultyLevel,
    selectedSections,
    instructions,
    experienceLevel,
    preferredProgrammingLanguages,
  } = req.body;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    if (
      !role ||
      !difficultyLevel ||
      !preferredProgrammingLanguages ||
      preferredProgrammingLanguages.length === 0 ||
      !selectedSections ||
      selectedSections.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields (Role, Difficulty, Programming Languages, Selected Sections) are missing or empty.",
      });
    }

    const prompt = generatePracticeQuestionForOATest({
      role,
      experienceLevel,
      difficultyLevel,
      preferredProgrammingLanguages,
      selectedSections,
      specialInstructions: instructions,
    });

    let llmResponse = await geminiApiForTextGeneration(prompt);

    const test = new OATest({
      user: userId,
      oaCategory,
      company: null,
      role,
      experienceLevel,
      difficulty: difficultyLevel,
      userSelectedSections: selectedSections || [],
      specialInstructions: instructions || null,
      preferredProgrammingLanguages: [...preferredProgrammingLanguages],
      sections: [],
    });

    if (llmResponse.length > 0) {
      const sectionPromises = llmResponse.map(async (sectionData) => {
        const newSection = await OATestSection.create([sectionData], {
          session: mongoSession,
        });
        return newSection;
      });

      const createdSections = await Promise.all(sectionPromises);
      createdSections.forEach((section) => {
        if (section) test.sections.push(section._id);
      });
    }

    await test.save({ session: mongoSession });

    await mongoSession.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Practice test created successfully.",
      testID: test._id,
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.error("Error in generatePracticeTest controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while generating the practice test. Please try again later.",
    });
  } finally {
    await mongoSession.endSession();
  }
};

export const getSections = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request",
      });
    }

    const oaTest = await OATest.findById(testId)
      .select("sections")
      .populate("sections")
      .exec();

    if (!oaTest) {
      return res.status(404).json({
        success: false,
        message: `No OA Test found with ID: ${testId}.`,
      });
    }

    console.log("OA TEST ::: ",oaTest)
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

// for the type of question other than coding (DSA,SQL,etc)
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

    const section = await OATestSection.findById(sectionId).select(
      "section_questions"
    );

    if (!section) {
      return res.status(404).json({
        success: false,
        message: `Section with ID: ${sectionId} not found.`,
      });
    }

    if (!section.section_questions || section.section_questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found within section with ID: ${sectionId}.`,
      });
    }

    const question = section?.section_questions.find(
      (q) => q.question_id === questionId
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: `Question with ID: ${questionId} not found in section ${sectionId}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question retrieved successfully.",
      question,
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

export const getSectionQuestions = async (req, res) => {
  try {
    const { testId, sectionId } = req.params;

    if (!testId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Test ID and Section ID are required.",
      });
    }

    const section = await OATestSection.findById(sectionId).select(
      "section_questions"
    );

    if (!section) {
      return res.status(404).json({
        success: false,
        message: `Section with ID: ${sectionId} not found.`,
      });
    }

    if (!section.section_questions || section.section_questions.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No questions found within section with ID: ${sectionId}.`,
        questions: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Questions for section retrieved successfully.",
      questions: section.section_questions,
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
/* 
for coding section candidate will submit single question from section
for other types : candidate will submit all the section once
submitting test: user will close the test and get feedback on there dashboard and also on email with in 24 hrs
*/

export const submitAnswer = async (req, res) => {
  try {
    const { section_id, question_id, submitted_answer, evaluation } = req.body;

    if (!section_id || !question_id || !submitted_answer || !evaluation) {
      return res.status(401).json({
        success: false,
        message: "Invalid request",
      });
    }

    const section = await OATestSection.findById(section_id).select(
      "section_answers"
    );
    if (!section) {
      throw new Error("Not able to find section");
    }

    const answer = {
      question_id,
      submitted_answer,
      evaluation,
    };

    section.section_answers.push(answer);

    await section.save();

    return res.status(201).json({
      success: true,
      message: "successfully submitted",
    });
  } catch (error) {
    console.log("Error in submitting question answer :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const submitSection = async (req, res) => {
  try {
    const { section_id, section_answers } = req.body;
    if (!section_id || !section_answers) {
      return res.status(401).json({
        success: false,
        message: "Invalid request",
      });
    }

    const section = await OATestSection.findById(section_id).select(
      "section_answers"
    );

    if (!section) {
      throw new Error("not able to get section");
    }

    section.section_answers = section_answers;

    console.log("Section Ssubmittion :: ", section);
    await section.save();

    return res.status(200).json({
      success: true,
      message: "successfully submitted",
    });
  } catch (error) {
    console.log("Error in submitting section answer :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const submitTest = async (req, res) => {
  const { testId } = req.body;
  const { userId } = req.user;

  const mongoSession = await mongoose.startSession();
  try {
    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }
    mongoSession.startTransaction();

    const test = await OATest.findById(testId)
      .select("oaCategory company role difficulty experienceLevel sections")
      .populate("sections")
      .exec();

    const testContext =
      test?.oaCategory === "companyspecific"
        ? {
            type: "companyspecific",
            company: test?.company,
            role: test?.role,
            experienceLevel: test?.experienceLevel,
          }
        : {
            type: "practice",
            role: test?.role,
            difficulty: test?.difficulty,
            experienceLevel: test?.experienceLevel,
          };

    const requiredSectionsData = [];
    const allTestSections = test?.sections;

    console.log("ALL TEST SECTIONS ::: ", allTestSections);

    allTestSections?.length > 0 &&
      allTestSections.forEach((element) => {
        const sectionObj = {};
        sectionObj.sectionName = element?.section_name;
        sectionObj.sectionType = element?.section_type;

        if (element?.section_type === "coding") {
          const submisssions = element?.section_answers.map((answer, index) => {
            const currentSubmissionObj = {};
            const id = answer?.question_id;
            const questionObj = element?.section_questions?.find(
              (question) => question?.question_id === id
            );

            currentSubmissionObj.questionDescription =
              questionObj?.question_description;
            currentSubmissionObj.questionTitle = questionObj?.question_title;
            currentSubmissionObj.submittedAnswer = answer.submitted_answer;
            currentSubmissionObj.evaluation = answer.evaluation;

            return currentSubmissionObj;
          });
          sectionObj.performance.submissions = submisssions;
        } else {
          const performance = {};
          performance.totalQuestions = element?.no_of_questions;
          let correctQuestions = 0;
          let incorrectQuestion = [];
          element?.section_answers.forEach((answer) => {
            if (answer.evaluation.isCorrect) {
              correctQuestions += 1;
            } else {
              const questionId = answer.question_id;
              const questionObj = element?.section_questions?.find(
                (question) => question?.question_id === questionId
              );
              incorrectQuestion.push(questionObj?.question_description);
            }
          });
          performance.totalCorrectQuestions = score;
          performance.incorrectQuestion = incorrectQuestion;
          sectionObj.performance = performance;
        }
        requiredSectionsData.push(sectionObj);
      });

    const prompt = oaTestFeedback({
      contextObject: testContext,
      sectionResults: requiredSectionsData,
    });
    const feedback = await geminiApiForTextGeneration(prompt);
    const score = feedback?.overallScore;

    await OATest.findByIdAndUpdate(
      testId,
      { feedback: feedback },
      { new: true }
    ).session(mongoSession);

    const analytics = await Analytics.findById(userId);
    const averageOaScore = analytics?.averageOaScore;
    const totalOaTests = analytics?.totalOaTests;

    const newOaTestCount = totalOaTests + 1;
    const newAverageScore =
      (averageOaScore * totalOaTests + score) / newOaTestCount;

    analytics.totalOaTests = newOaTestCount;
    analytics.averageOaScore = newAverageScore;

    await analytics.save({ session: mongoSession });

    // TODO: very expansive controller, we can use background task queue
    await mongoSession.commitTransaction();
    return res.status(200).json({
      success: true,
      message:
        "Test successfully submitted, score and feedback will be available on dashboard soon...",
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.log("Error in submitting test :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again...",
    });
  } finally {
    await mongoSession.endSession();
  }
};
