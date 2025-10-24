import mongoose, { Schema } from "mongoose";

const oaTestSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    testCategory: {
      type: String,
      enum: ["companyspecific", "practice"],
      default: "companyspecific",
      lowercase: true,
    },

    // for company specific test
    companyName: {
      type: String,
      required: function () {
        return this.testCategory === "companyspecific";
      },
    },

    role: {
      type: String,
      required: function () {
        return this.testCategory === "companyspecific";
      },
    },

    experienceLevel: {
      type: String,
      required: function () {
        return this.testCategory === "companyspecific";
      },
    },

    // for practice test
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Expert", ""],
      default: "",
    },

    userSelectedSections: [
      {
        type: String,
        required: function () {
          return this.testCategory !== "companyspecific";
        },
      },
    ],

    specialInstructions: { type: String, default: null },

    // required for both kind of test
    duration: { type: Number },

    sections: [
      {
        type: Schema.Types.ObjectId,
        ref: "OATestSections",
        required: true,
      },
    ],

    status: {
      type: "String",
      enum: ["pending", "submitted"],
      default: "pending",
      required: true,
    },

    feedback: {
      type: Schema.Types.Mixed,
    },

    score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OATest", oaTestSchema);
