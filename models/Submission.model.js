import { model, Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    programmingLanguage: {
      type: String,
      required: true,
    },
    passedTestCasesCount: {
      type: Number,
      required: true,
    },
    allTestCasesCount: {
      type: Number,
      required: true,
    },
    error: {
      type: String,
    },
    overallStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default model('Submission', submissionSchema)