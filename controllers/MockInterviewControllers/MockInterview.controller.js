import { z } from "zod";
import { systemInstructionPrompt } from "../../aiPrompts/mockInterview/systemInstrctions.js";
import MockInterview from "../../models/MockInterview.model.js";
import { addInstructions } from "../../utils/MockInterview/sytemInstructions/index.js";
import {
  companySpecificMockSchema,
  skillBasedMockSchema,
} from "../../validators/mockInterviewValidators.js";
import { systemInstructionForSkillBasedInterview } from "../../aiPrompts/mockInterview/systemInstructionForSkillBasedInterview.js";

export const createCompanySpecificMockInterview = async (req, res) => {
  try {
    const validatedBody = companySpecificMockSchema.parse(req.body);
    const { companyName, experienceLevel, role, mockCategory } = validatedBody;
    const { userId } = req.user;

    let prompt;
    try {
      prompt = systemInstructionPrompt(companyName, role, experienceLevel);
    } catch (apiError) {
      console.log("ERROR IN GENERATING SYSTEM INSTRUCTION :: ", apiError);
      return res.status(503).json({
        success: false,
        message:
          "The AI service is currently unavailable. Please try again later.",
      });
    }

    const newMockInterview = new MockInterview({
      user: userId,
      mockCategory,
      companyName,
      experienceLevel,
      role,
    });
    await newMockInterview.save();

    await addInstructions(newMockInterview._id, prompt);

    return res.status(201).json({
      success: true,
      message: "Mock interview created successfully.",
      id: newMockInterview._id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.log("ERROR IN CREATING COMPANY SPECIFIC MOCK INTERVIEW :: ", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred. Please try again later.",
    });
  }
};

export const createSkillBasedMockInterview = async (req, res) => {
  try {
    const validatedBody = skillBasedMockSchema.parse(req.body);
    const { mockCategory, skills, experienceLevel, difficulty } = validatedBody;
    const { userId } = req.user;

    const newMockInterview = new MockInterview({
      user: userId,
      mockCategory,
      skills,
      experienceLevel,
      difficultyLevel: difficulty,
    });

    await newMockInterview.save();
    const prompt = systemInstructionForSkillBasedInterview(
      skills,
      difficulty,
      experienceLevel
    );
    await addInstructions(newMockInterview._id, prompt);

    return res.status(201).json({
      success: true,
      message: "Skill-based mock interview created successfully.",
      id: newMockInterview._id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.log("ERROR IN CREATING SKILL BASED MOCK INTERVIEW :: ", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred. Please try again later.",
    });
  }
};

export const getFeedback = async (req, res) => {
  const { interviewId } = req.params;

  if (!interviewId) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid interviewId",
    });
  }

  try {
    const interview = await MockInterview.findById(interviewId)
      .select("feedback score")
      .lean();

    if (interview?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Invalid request, first submit interview",
      });
    }
    if (!interview.feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found, might be in generation phase",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback got successfully",
      feedback: interview?.feedback,
    });
  } catch (error) {
    console.log("ERROR IN GETTING FEEDBACK FOR OA interview :: ", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error comes, please check after some time",
    });
  }
};
