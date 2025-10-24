import { model, Schema } from "mongoose";

const OATestSectionSchema = new Schema(
  {
    name: { type: String, required: true },

    type: {
      type: String,
      enum: ["single_choice", "multiple_choice", "coding", "text"],
      required: true,
    },

    noOfQuestions: { type: Number, required: true },

    questions: [
      {
        slug: { type: String },

        title: { type: String },

        description: { type: String, required: true },

        submission: {
          type: Schema.Types.ObjectId,
          ref: "Submission",
        },

        options: [{ type: String }],

        correctOptions: [{ type: String }],
      },
    ],

    result: {
      type: Schema.Types.ObjectId,
      ref: "SectionResult",
    },
  },
  { timestamps: true }
);

// OATestSectionSchema.pre("save", function (next) {
//   if (this.noOfQuestions !== this.questions.length) {
//     return next(new Error("noOfQuestions must match questions array length"));
//   }
//   next();
// });

export default model("OATestSections", OATestSectionSchema);
