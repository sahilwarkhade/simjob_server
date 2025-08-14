import mongoose from "mongoose";

const oaAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: "OATest", required: true },
  answers: [
    {
      questionId: Number,
      response: String, // selected option or code
      isCorrect: Boolean,
      outputMatched: Boolean, // for coding
    },
  ],
  score: Number,
  submittedAt: { type: Date, default: Date.now },
  durationTaken: Number, // in seconds
});

export default mongoose.model("OAAttempt", oaAttemptSchema);
