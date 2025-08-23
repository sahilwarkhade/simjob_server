import { GoogleGenAI } from "@google/genai";
import { extractJson } from "../extractJson.js";

export async function geminiApiForTextGeneration(prompt) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GoogleGenAI || "AIzaSyBIKKqwmMYxkQ2wIkN-ssOqbPN2xR6i6m0" });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    // console.log(response.text)
    const extractedJson = extractJson(response.text);
    return extractedJson;
  } catch (err) {
    console.log(err.message);
  }
}
