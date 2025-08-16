import mongoose from "mongoose";

const oaTestSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  oaCategory: {
    type: String,
    enum: ["company specific", "practice"],
    default: "company specific",
  },

  company: [{ type: String, required: true }],

  role: { type: String },

  experienceLevel: {
    type: String,
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard", "expert"],
    default: "medium",
  },

  testSections: [{ type: String }],

  duration: { type: Number },

  specialIntructions: { type: string },

  questions: [
    {
      questionText: String,
      type: { type: String, enum: ["mcq", "coding"] },
      options: [{ type: String }], // for MCQ
      correctOption: { type: String }, // for MCQ
      codeStarter: { type: String }, // for coding
      testCases: [
        {
          input: { type: String },
          expectedOutput: { type: String },
        },
      ],
    },
  ],

  feedback: {
    type: Object,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("OATest", oaTestSchema);
