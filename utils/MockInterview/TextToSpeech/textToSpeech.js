import { GoogleGenAI } from "@google/genai";
import { convertToWav } from "../convertToWavFile.js";

export async function textToSpeech(text) {
  try {
    if(!text) throw new Error("Text is required to tranform text to speech");
    const ai = new GoogleGenAI({ apiKey: process.env.GoogleGenAI });
    const model = "gemini-2.5-flash-preview-tts";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: text,
          },
        ],
      },
    ];
  
    const config = {
      temperature: 1,
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "achernar",
          },
        },
      },
    };
  
    const response = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });
  
    let audioBuffer;
  
    for await (const chunk of response) {
      const part = chunk.candidates?.[0]?.content?.parts?.[0];
  
      if (part?.inlineData?.data && part.inlineData.mimeType) {
        const { data, mimeType } = part.inlineData;
        const buffer = convertToWav(data, mimeType); // buffer 
        audioBuffer = buffer;
        break;
      }
    }
    return audioBuffer;
  } catch (error) {
    console.log("Error in generating text to speech :: ", error.message)
  }
}