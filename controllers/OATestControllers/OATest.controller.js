import OATestSection from "../../models/OATestSection.model.js";
import OATest from "../../models/OATest.model.js";

export const generateCompanySpecificTest = async (req, res) => {
  try {
    const {
      company,
      role,
      experienceLevel,
      selectedSections,
      focusArea,
      instructions,
      preferredProgrammingLanguages,
    } = req.body;

    if (
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

    //sections logic here
    //OA test model logic

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      // pass test here
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
      role,
      difficultyLevel,
      duration,
      selectedTestSections,
      instructions,
      preferredProgrammingLanguages,
    } = req.body;

    if (
      !role ||
      !difficultyLevel ||
      !duration ||
      !preferredProgrammingLanguages ||
      !selectedTestSections
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Required field are important to generate test, so please select required field",
      });
    }

    // gemini api call here
    // sections logic
    // save test to db
    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      // pass test here
    });
  } catch (error) {
    console.log("Error in generating practice test :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

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
    const { section_id, question_id, submitted_answer, reason_of_failure } =
      req.body;

    if (!section_id || !question_id || !submitted_answer) {
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
      reason_of_failure,
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


export const submitTest=async(req,res)=>{
  try {
    const {testId}=req.body;

    if(!testId){
      return res.status(401).json({
        success: false,
        message: "Invalid request",
      });
    }
    

    const test=await OATest.findById(testId);

    // get the required information and provide that to prompt so that ai able to generate feedback;
    // store feedback in DB
    // increase the count of OA Mock test, calculate avg mock score of user till now and update the analysis model

    return res.status(200).json({
      success:true,
      message:"Test successfully submitted, score and feedback will be available on dashboard soon..."
    })

  } catch (error) {
    console.log("Error in submitting test :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again...",
    });
  }
}