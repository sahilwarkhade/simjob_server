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
    },

    additionalDetails: {
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
      default: "https://t4.ftcdn.net/jpg/07/03/86/11/360_F_703861114_7YxIPnoH8NfmbyEffOziaXy0EO1NpRHD.jpg",
    },
    google: { type: String, unique: true, sparse: true },
    github: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default model("User", userSchema);
