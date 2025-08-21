import mongoose, { Schema } from "mongoose";

const mockInterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mockCategory: {
    type: String,
    enum: ["company specific", "skill based"],
    default: "company specific",
  },
  companyName: {
    type: String,
  },
  skills: [{ type: String }],
  role: {
    type: String,
  },
  experienceLevel: {
    type: String,
  },
  focusArea: {
    type: String,
  },
  difficultyLevel: {
    type: String,
    enum: ["Easy", "Medium", "Hard", "Expert"],
    default: "Medium",
  },
  duration: { type: Number },
  specialIntructions: {
    type: String,
  },
  questions: [
    {
      type: Schema.Types.Mixed,
    },
  ],
  feedback: {
    type: Schema.Types.Mixed,
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
  // transcript: { type: String }, // full STT transcript
  // audioURL: { type: String }, // optional: store audio file for playback

},{timestamps:true});

export default mongoose.model("MockInterview", mockInterviewSchema);
