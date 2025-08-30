import { model, Schema } from "mongoose";

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
        difficulty: { type: String, enum: ["easy", "medium", "hard", 'expert'] },
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

        constraints: { type: String, default: null },
        starter_code: [
          { type: Schema.Types.Mixed },
        ] /*Only for coding section*/,

        options: [
          {
            text: { type: String },
            isCorrect: { type: Boolean, required: true, default: false },
          },
        ], // For multiple-choice or single-choice questions
      },
    ],

    // no_of_answered_question: { type: Number, default: 0 },

    section_answers: [
      {
        question_id: {
          type: String,
          // required: true,
        },
        submitted_answer: {
          type: String,
          default: null,
        },
        evaluation:{
          type:Schema.Types.Mixed
        }
      },
    ],
  },
  { timestamps: true }
);

export default model("OATestSections", OATestSectionSchema);
