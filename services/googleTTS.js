import { connection as redis } from "../config/redis.js";
import textToSpeech from "@google-cloud/text-to-speech";
const client = new textToSpeech.TextToSpeechClient();

export async function streamTextToSpeech(text, sessionId) {
  const [response] = await client.synthesizeSpeech({
    input: {
      text,
    },
    voice: { languageCode: "en-IN", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" },
  });

  const channel = `session:${sessionId}:audio`;
  if (response.audioContent) {
    redis.publish(channel, response.audioContent.toString("base64"));
    // fs.writeFileSync("output.mp3", response.audioContent, "binary");
  }
  console.log("✅ Audio passed");
}

