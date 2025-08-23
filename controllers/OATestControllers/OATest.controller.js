import OATestSection from "../../models/OATestSection.model.js";
import OATest from "../../models/OATest.model.js";
import { generateCompanySpecificTestSections } from "../../aiPrompts/generateCompanySpecificTest.js";
import { geminiApiForTextGeneration } from "../../utils/AI/geminiApiForTextGeneration.js";
import { generatePracticeQuestionForOATest } from "../../aiPrompts/generatePracticeQuestionForOATest.js";
import { oaTestFeedback } from "../../aiPrompts/oaTestFeedback.js";
import Analytics from "../../models/Analytics.model.js";

export const generateCompanySpecificTest = async (req, res) => {
  try {
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

    if (
      !oaCategory ||
      !company ||
      !role ||
      !experienceLevel ||
      !preferredProgrammingLanguages
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Required field are important to generate test, so please select required field",
      });
    }

    //gemini API call here;
    const prompt = generateCompanySpecificTestSections(
      company,
      role,
      experienceLevel,
      preferredProgrammingLanguages,
      selectedSections,
      instructions
    );

    const test = new OATest({
      user: userId,
      oaCategory,
      company,
      role,
      experienceLevel,
      difficulty: null,
      userSelectedSections: selectedSections ? [...selectedSections] : null,
      specialInstructions: instructions ? instructions : null,
      preferredProgrammingLanguges: [...preferredProgrammingLanguages],
    });

    const response = await geminiApiForTextGeneration(prompt);
    response.length > 0 &&
      response.forEach(async (element) => {
        const section = await OATestSection.create(element);
        if (section) test.sections.push(section?._id);
      });

    await test.save();

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      testDetails: test,
    });
  } catch (error) {
    console.log("Error in generating company specific test :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const generatePracticeTest = async (req, res) => {
  try {
    const {
      oaCategory,
      role,
      difficultyLevel,
      selectedSections,
      instructions,
      experienceLevel,
      preferredProgrammingLanguages,
    } = req.body;

    if (
      !role ||
      !difficultyLevel ||
      !preferredProgrammingLanguages ||
      !selectedSections
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Required field are important to generate test, so please select required field",
      });
    }

    // gemini api call here

    const test = new OATest({
      oaCategory,
      company: null,
      role,
      experienceLevel,
      difficulty: difficultyLevel,
      userSelectedSections: selectedSections ? [...selectedSections] : null,
      specialInstructions: instructions ? instructions : null,
      preferredProgrammingLanguges: [...preferredProgrammingLanguages],
    });

    const prompt = generatePracticeQuestionForOATest({
      role,
      experienceLevel,
      difficultyLevel,
      preferredProgrammingLanguages,
      selectedSections,
      specialInstructions,
    });
    const response = await geminiApiForTextGeneration(prompt);

    response.length > 0 &&
      response.forEach(async (element) => {
        const section = await OATestSection.create(element);
        if (section) {
          test.sections.push(section?._id);
        }
      });

    await test.save();

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      testDetails: test,
    });
  } catch (error) {
    console.log("Error in generating practice test :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const getSections=async(req,res)=>{
  try {
    const {testId}=req.params;
    if (!testId) {
      return res.status(401).json({
        success: false,
        message: "Invalid request",
      });
    }

    const allSections=await OATest.findById(testId).select('sections').populate('sections');

    if(!allSections){
      throw new Error('Somthing went wrong 1');
    }

    return res.status(200).json({
      success:true,
      message:"Successfully got sections",
      sections:allSections?.sections
    })
  } catch (error) {
    console.log("Error in getting sections :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
}
export const getQuestion = async (req, res) => {
  try {
    const { testId, sectionId, questionId } = req.params;

    if (!testId || !sectionId || !questionId) {
      return res.status(401).json({
        success: false,
        message: "Invalid request",
      });
    }

    const section = await OATestSection.findById(sectionId).select(
      "section_questions"
    );

    if (!section || section?.section_question.length === 0) {
      throw new Error("Not able to create questions");
    }

    const questions = section?.section_question;
    const question = questions?.find(
      (question) => question?.question_id === questionId
    );

    if (!question) {
      throw new Error("Not getting question to given question id");
    }

    return res.status(200).json({
      success: true,
      message: "Successfully got the question",
      question,
    });
  } catch (error) {
    console.log("Error in getting question :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

// for the type of question other than coding (DSA,SQL,etc)
export const getSectionQuestions = async (req, res) => {
  try {
    const { testId, sectionId } = req.params;
    if (!testId || !sectionId) {
      return res.status(401).json({
        success: false,
        message: "Invalid request",
      });
    }

    const section = await OATestSection.findById(sectionId).select(
      "section_questions"
    );
    if (!section || section?.section_question?.length === 0) {
      throw new Error("Not able to create questions");
    }

    const questions = section?.section_question;
    if (!questions) {
      throw new Error("Not getting question to given question id");
    }
    return res.status(200).json({
      success: true,
      message: "Successfully got all question of section",
      questions,
    });
  } catch (error) {
    console.log("Error in getting section questions :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
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
  try {
    const { testId } = req.body;
    const { userId } = req.user;

    if (!testId) {
      return res.status(401).json({
        success: false,
        message: "Invalid request",
      });
    }

    const test = await OATest.findById(testId)
      .select("oaCategory company role difficulty experienceLevel sections")
      .populate("sections");

    const testContext =
      test?.oaCategory === "company specific"
        ? {
            type: "company_specific",
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
    );

    const analytics = await Analytics.findById(userId);
    const averageOaScore = analytics?.averageOaScore;
    const totalOaTests = analytics?.totalOaTests;

    const newOaTestCount = totalOaTests + 1;
    const newAverageScore =
      (averageOaScore * totalOaTests + score) / newOaTestCount;

    analytics.totalOaTests = newOaTestCount;
    analytics.averageOaScore = newAverageScore;

    await analytics.save();

    // TODO: we can use transactions.
    // TODO: very expansive controller, we can use background task queue
    return res.status(200).json({
      success: true,
      message:
        "Test successfully submitted, score and feedback will be available on dashboard soon...",
    });
  } catch (error) {
    console.log("Error in submitting test :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again...",
    });
  }
};
