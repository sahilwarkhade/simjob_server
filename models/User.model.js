import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
  },
  additionalDetailes: {
    type: Schema.Types.ObjectId,
    ref: "Profile",
  },
  role: {
    type: String,
    enum: ["candidate", "admin"],
    default: "candidate",
  },

  mockHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "MockInterview",
    },
  ],

  oaAttempts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OAAttempt",
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model("User", userSchema);
