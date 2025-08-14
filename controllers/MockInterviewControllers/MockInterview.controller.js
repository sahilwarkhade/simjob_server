import axios from "axios";
import MockInterview from "../../models/MockInterview.model.js";
import { genrateQuestions } from "../../utils/MockInterview/generateQuestions.js";
import { generateAudio } from "../../utils/MockInterview/TextToSpeech/generateAudio.js";
import { sendAudioResponse } from "../../utils/MockInterview/TextToSpeech/sendAudioResponse.js";
import { textToSpeech } from "../../utils/MockInterview/TextToSpeech/textToSpeech.js";
import NodeCache from "node-cache";
const myCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 70 * 60 });
import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from "@google/genai";
import fs from "fs/promises";
import { uploadToCloudinary } from "../../utils/MockInterview/Upload/uploadToCloudinary.js";
import { feedbackPrompt } from "../../aiPrompts/feedbackPrompt.js";
import { answerAnalysisPrompt } from "../../aiPrompts/answeAnalysisPrompt.js";
import { generateId } from "../../utils/generateID.js";
import { deleteAssetFromCloudinary } from "../../utils/MockInterview/Upload/deleteAssetFromClodinary.js";
import { introductionPrompt } from "../../aiPrompts/introductionPrompt.js";
const ai = new GoogleGenAI({ apiKey: process.env.GoogleGenAI });

export const startMockInterview = async (req, res) => {
  const { role, difficultyLevel, interviewTopic } = req.body;
  const userId = req.user.userId;
  try {
    const generatedQuestion = await genrateQuestions(
      role,
      difficultyLevel,
      interviewTopic
    );

    const newMockInterview = new MockInterview({
      user: userId,
      role,
      difficultyLevel,
      topic: interviewTopic,
    });

    const updatedQuestionWithAudioFile = await generateAudio(
      generatedQuestion,
      newMockInterview._id
    );

    if (updatedQuestionWithAudioFile.length != generatedQuestion.length) {
      return res.status(401).json({
        success: false,
        error:
          "Not Able to generate interview question, please try after some time",
      });
    }

    newMockInterview.questions = [...updatedQuestionWithAudioFile];

    await newMockInterview.save();

    return res.status(201).json({
      success: true,
      mockInterview: newMockInterview,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const askQuestions = async (req, res) => {
  const { mockInterviewId, questionId } = req.params;
  try {
    let questions;
    if (!questionId) {
      let result = await MockInterview.findById(mockInterviewId)
        .select("questions role topic")
        .lean();
      if (!result) {
        throw new Error("This Mock Interview Is Not Valid Create Another");
      }
      questions = result.questions;
      myCache.set(mockInterviewId.toString(), [...questions]);
      const introPrompt=introductionPrompt(result?.role, result?.topic, questions.length)
      let audioBuffer = await textToSpeech(introPrompt);

      if (!audioBuffer || audioBuffer.length === 0) {
        return res.status(500).json({ error: "No audio received from Gemini" });
      }

      return sendAudioResponse(res, audioBuffer, questions[0]?.id, false);
    }

    let cachedQuestion = myCache.get(mockInterviewId.toString());
    if (!cachedQuestion) {
      const result = await MockInterview.findById(mockInterviewId)
        .select("questions")
        .lean();
      cachedQuestion = result?.questions;
      myCache.set(mockInterviewId.toString(), cachedQuestion);
      if (!cachedQuestion) {
        throw new Error("Questions not generated");
      }
    }
    let question;
    let currentIndex = -1;
    for (let index = 0; index < cachedQuestion.length; index++) {
      if (cachedQuestion[index].id === questionId) {
        question = cachedQuestion[index];
        currentIndex = index;
        break;
      }
    }

    let isLastQuestion = false;
    if (currentIndex + 1 === cachedQuestion.length) {
      isLastQuestion = true;
    }

    const audioUrl = question.audioUrl;
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(response.data);

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(500).json({ error: "No audio received from Gemini" });
    }

    let nextQuestionId = cachedQuestion[currentIndex + 1]?.id || -1;

    return sendAudioResponse(res, audioBuffer, nextQuestionId, isLastQuestion);
  } catch (error) {
    console.log("Error in doing mock interview", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const analysisAnswer = async (req, res) => {
  const { mockInterviewId, questionId } = req.params;
  const answerFile = req.file;

  if (!mockInterviewId) {
    return res
      .status(400)
      .json({ success: false, message: "Mock Interview ID is required." });
  }
  if (!questionId) {
    return res
      .status(400)
      .json({ success: false, message: "Question ID is required." });
  }
  if (!answerFile) {
    return res
      .status(400)
      .json({ success: false, message: "Answer audio file is missing." });
  }

  const tempFilePath = answerFile.path;

  try {
    const mockInterview = await MockInterview.findById(mockInterviewId);
    if (!mockInterview) {
      return res.status(400).json({
        success: "false",
        error: "Mock Interview not found",
      });
    }
    const questions = mockInterview?.questions;
    const question = questions?.find((question) => question?.id === questionId);
    const answers = mockInterview?.answers;

    const candidateProfile = mockInterview?.role;
    const prompt = answerAnalysisPrompt(
      candidateProfile,
      question?.question_text
    );

    const [cloudinaryResult, geminiResult] = await Promise.allSettled([
      await uploadToCloudinary(
        tempFilePath,
        "simjob_interview_audio",
        "wav",
        "video"
      ),

      (async () => {
        const myfile = await ai.files.upload({
          file: tempFilePath,
          config: { mimeType: "audio/wav" },
        });

        const geminiResponse = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: createUserContent([
            createPartFromUri(myfile.uri, myfile.mimeType),
            prompt,
          ]),
        });
        return geminiResponse.text;
      })(),
    ]);

    let audioPublicUrl;
    let feedbackText;

    if (
      cloudinaryResult.status === "fulfilled" &&
      cloudinaryResult.value?.secure_url
    ) {
      console.log("cloudinaryResult :: ", cloudinaryResult.value);
      audioPublicUrl = cloudinaryResult.value.secure_url;
      console.log(`Audio uploaded to Cloudinary: ${audioPublicUrl}`);
    } else {
      const reason = cloudinaryResult.reason || "No secure URL returned.";
      throw new Error("Cloudinary upload failed:", reason);
    }

    if (geminiResult.status === "fulfilled") {
      feedbackText = geminiResult.value;
      console.log(`Gemini generated feedback for ${mockInterviewId}.`);
    } else {
      deleteAssetFromCloudinary(cloudinaryResult?.value?.public_id);
      throw new Error(
        "Gemini feedback generation failed:",
        geminiResult.reason
      );
    }

    await fs.unlink(tempFilePath);
    console.log(`Temporary file ${tempFilePath} deleted.`);

    const answerObject = {
      id: generateId(),
      question_text: question?.question_text,
      answerFeedback: feedbackText,
      answerAudioFile: audioPublicUrl,
    };

    answers.push(answerObject);
    await mockInterview.save();
    res.status(200).json({
      success: true,
      feedback: feedbackText,
      audioPublicUrl,
    });
  } catch (error) {
    console.error("Error in generating feedback:", error);
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`Temporary file ${tempFilePath} deleted after error.`);
      } catch (unlinkError) {
        console.error(
          `Failed to delete temp file ${tempFilePath}:`,
          unlinkError
        );
      }
    }
    return res.status(500).json({
      success: false,
      error: "Something went wrong during answer feedback generation.",
      details: error.message,
    });
  }
};

export const generateFeedback = async (req, res) => {
  const { mockInterviewId } = req.params;

  if (!mockInterviewId) {
    return res
      .status(400)
      .json({ success: false, message: "Mock Interview ID is required." });
  }

  try {
    const mockInterview = await MockInterview.findById(mockInterviewId);
    if (!mockInterview) {
      return res.status(400).json({
        success: false,
        error: "Mock Interview is needed",
      });
    }

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: feedbackPrompt(
        mockInterview?.role,
        mockInterview?.topic,
        mockInterview?.answers
      ),
    });

    mockInterview.feedback = geminiResponse.text;
    await mockInterview.save();
    return res.status(200).json({
      success: true,
      feedback: geminiResponse.text,
    });
  } catch (error) {
    console.log(
      "Error in generating overall feedback of answer ",
      error.message
    );
    return res.status(500).json({
      success: false,
      error: "Something went wrong in generating mock interview feedback",
    });
  }
};
