import { generateId } from "../../generateID.js";
import { uploadAudioToCloudinary } from "../Upload/uploadAudioFileToCloudinary.js";
import { textToSpeech } from "./textToSpeech.js";

export async function generateAudio(questions, mockInterviewId) {
  try {
    const uploadedQuestions = await Promise.all(
      questions.map(async (q) => {
        let id = generateId();
        const publicId = `${mockInterviewId}_${id}`;
        const buffer = await textToSpeech(q.question_text);
        const cloudinaryUrl = await uploadAudioToCloudinary(buffer, publicId);
        return {
          ...q,
          id: id,
          audioUrl: cloudinaryUrl,
        };
      })
    );
    return uploadedQuestions;
  } catch (error) {
    console.log("ERROR in generating audio : ", error.message);
    return [];
  }
}
