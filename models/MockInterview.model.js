import mongoose, { Schema } from "mongoose";

const mockInterviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mockCategory: {
      type: String,
      enum: ["companyspecific", "skillbased"],
      lowercase: true,
      required: true,
    },
    companyName: {
      type: String,
      required: function () {
        return this.mockCategory === "companyspecific";
      },
    },
    skills: [
      {
        type: String,
        required: function () {
          return this.mockCategory === "skillbased";
        },
      },
    ],
    role: {
      type: String,
      required: function () {
        return this.mockCategory === "companyspecific";
      },
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    difficultyLevel: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Expert", ""],
      default: "",
    },
    duration: {
      type: Number,
    },
    feedback: {
      type: Schema.Types.Mixed,
    },
    transcript: { type: String },
    status: {
      type: String,
      enum: ["pending", "submitted"],
    },
    score: {
      type: Number,
      default:0
    },
  },
  { timestamps: true }
);

export default mongoose.model("MockInterview", mockInterviewSchema);
