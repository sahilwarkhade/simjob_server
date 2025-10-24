import { GoogleGenAI } from "@google/genai";
import { extractJson } from "../extractJson.js";

export async function geminiApiForTextGeneration(
  prompt,
  model = "gemini-2.5-flash",
  outputType = "JSON"
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    if (outputType === "text") {
      return response.text;
    }

    const extractedJson = extractJson(response.text);
    return extractedJson;
  } catch (error) {
    console.error("ERROR IN GEMINI API :: ", error);
    throw error
  }
}
