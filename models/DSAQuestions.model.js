import { model, Schema } from "mongoose";

const dsaQuestionsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  description: {
    type: String,
    required: true,
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },

  examples: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true },
      explanation: { type: String },
      image: { type: String },
    },
  ],

  images: [{ type: String }],

  constraints: [{ type: String, required: true }],

  boilerplateCode: { type: Schema.Types.Mixed, required: true },

  testCases: {
    visibleTestCases: [
      {
        tcId: { type: String, required: true },
        inputPath: { type: String, required: true },
        outputPath: { type: String, required: true },
      },
    ],
    hiddenTestCases: [
      {
        tcId: { type: String, required: true },
        inputPath: { type: String, required: true },
        outputPath: { type: String, required: true },
      },
    ],
  },

  tags: [{ type: String }],
});

export default model("DSAQuestion", dsaQuestionsSchema);
