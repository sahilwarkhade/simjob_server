import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide your name."],
      minLength: 3,
    },

    email: {
      type: String,
      required: [true, "Please provide your email."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
    },

    authStrategy: {
      type: String,
      enum: ["local", "google", "github"],
      required: true,
    },

    password: {
      type: String,
      required: function () {
        return this.authStrategy === "local";
      },
      minlength: 3,
      select: false,
    },

    additionalDetailes: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
    },

    accountType: {
      type: String,
      enum: ["candidate", "interviewer", "admin"],
      default: "candidate",
    },

    avatar: {
      type: String,
      default: "",
    },
    google: { type: String, unique: true, sparse: true },
    github: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default model("User", userSchema);
