import mongoose from "mongoose";

const oaTestSchema = new mongoose.Schema({
  company: { type: String, required: true }, // e.g., "Amazon"
  role: { type: String }, // e.g., "Frontend Developer"
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },

  // ✅ New field: test type
  testType: {
    type: String,
    enum: ["mcq", "coding", "mixed"],
    default: "mixed"
  },

  questions: [
    {
      questionText: String,
      type: { type: String, enum: ["mcq", "coding"] },
      options: [String], // for MCQ
      correctOption: String, // for MCQ
      codeStarter: String,   // for coding
      testCases: [
        {
          input: String,
          expectedOutput: String,
        },
      ],
    },
  ],

  duration: Number, // in minutes
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("OATest", oaTestSchema);
