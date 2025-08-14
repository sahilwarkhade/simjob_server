import mongoose from "mongoose";

const mockInterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required:true}, // e.g., "SDE", "Data Analyst"
  topic: { type: String, required:true}, // e.g., "Behavioral", "DSA", "System Design"
  difficultyLevel: {
    type: String,
    enum: ["Easy", "Medium", "Hard", "Expert"],
    default: "Easy",
  },
  questions: [{ type: Object }], // asked questions
  answers: [{ type: Object }], // user's answers
  transcript: { type: String }, // full STT transcript
  audioURL: { type: String }, // optional: store audio file for playback
  feedback: {type: String},
  duration: Number, // in seconds
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("MockInterview", mockInterviewSchema);
