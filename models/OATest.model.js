import mongoose, { Schema } from "mongoose";

const oaTestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    oaCategory: {
      type: String,
      enum: ["company specific", "practice"],
      default: "company specific",
    },

    company: { type: String, required: true },

    role: { type: String },

    experienceLevel: {
      type: String,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      default: "medium",
    },

    userSelectedSections: [{ type: String }],

    duration: { type: Number },

    specialInstructions: { type: String },

    preferredProgrammingLanguges: [{ type: String, required: true }],

    sections: [
      {
        type: Schema.Types.ObjectId,
        ref: "OATestSections",
      },
    ],

    feedback: {
      type: Schema.Types.Mixed,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OATest", oaTestSchema);
