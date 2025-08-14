import { GoogleGenAI } from "@google/genai";
import { extractJson } from "../extractJson.js";
import questionGenerationPrompt from "../../aiPrompts/questionGeneration.js";

export async function genrateQuestions(role, difficultyLevel, type) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GoogleGenAI });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: questionGenerationPrompt(type, difficultyLevel, role),
    });
    const extractedJson = extractJson(response.text);
    return extractedJson;
  } catch (err) {
    console.log(err.message);
  }
}
