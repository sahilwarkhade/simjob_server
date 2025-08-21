import { Schema } from "mongoose";

const OATestSectionSchema = new Schema(
  {
    section_name: { type: String, required: true },
    section_type: {
      type: String,
      enum: ["single_choice", "multiple_choice", "coding", "text"],
      required: true,
    },
    no_of_questions: { type: Number, required: true },
    section_questions: [
      {
        question_id: {
          type: String,
          required: true,
        },
        question_title: { type: String } /*only for coding section*/,
        question_description: { type: String },
        difficulty: { type: String, enum: ["easy", "medium", "hard"] },
        test_cases: {
          visible: [
            {
              test_case_id: { type: String },
              input: { type: String },
              expected_output: { type: String },
              explanation: { type: String },
            },
          ],
          hidden: [
            {
              test_case_id: { type: String },
              input: { type: String },
              expected_output: { type: String },
            },
          ],
        } /*Only for coding section*/,

        options: [
          {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, required: true, default: false },
          },
        ], // For multiple-choice or single-choice questions

        starter_code: [
          { type: Schema.Types.Mixed },
        ] /*Only for coding section*/,
      },
    ],

    no_of_answered_question: { type: Number, default: 0 },
    section_answers: [
      {
        question_id: {
          type: String,
          required: true,
        },
        submitted_answer: {
          type: String,
          default: null,
        },
        reason_of_failure: {
          type: String,
        },
        is_correct: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export default model("OATestSections", OATestSectionSchema);
