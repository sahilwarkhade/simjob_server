import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "FATAL ERROR in gemini.js: GEMINI_API_KEY is not defined. Check your .env file."
  );
}


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function* getGeminiResponseStream(history = [], instructions) {
  const safeHistory = Array.isArray(history) ? history : [];

  const lastMessage =
    safeHistory.length > 0
      ? safeHistory[safeHistory.length - 1].parts?.[0]?.text || ""
      : "";

  if (!lastMessage) {
    console.warn("Gemini service called with empty history. Aborting.");
    return;
  }

  console.log("history :: ", JSON.stringify(safeHistory));

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: JSON.stringify(safeHistory),
      config: {
        systemInstruction: instructions,
      },
    });

    for await (const chunk of response) {
      const chunkText = chunk?.text;
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    yield "I'm sorry, I encountered a technical issue.";
  }
}

export async function generateSummary(history) {
  console.log("SUM HIS :: ",JSON.stringify([...history]))
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      text: JSON.stringify([...history]),
    },
    config: {
      systemInstruction:
        "You are a great summarizer. Summarize the conversation so far in 3-4 sentences, keeping only the important technical details.",
    },
  });

  return result.text;
}
