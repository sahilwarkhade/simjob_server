import { model, Schema } from "mongoose";

const sectionResultSchema = new Schema({
  sectionId: {
    type: Schema.Types.ObjectId,
  },
  totalAnsweredQuestion: {
    type: Number,
  },
  score: {
    type: Number,
  },
  correctQuestions: [
    {
      type: String,
    },
  ],
  incorrectQuestions: [
    {
      type: String,
    },
  ],
  unansweredQuestions: [
    {
      type: String,
    },
  ],
});

export default model("SectionResult", sectionResultSchema);
