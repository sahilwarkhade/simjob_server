import { model, Schema } from "mongoose";

const profileSchema = new Schema(
  {
    personalInformation: {
      mobileNumber: {
        type: String,
        default: "",
        match: [/^\+?[1-9]\d{1,14}$/, "Invalid mobile number"], // E.164 format
      },

      address: {
        type: String,
        default: "",
      },

      website: {
        type: String,
        default: "",
      },

      linkedinUrl: {
        type: String,
        default: "",
        match: [
          /^https?:\/\/(www\.)?linkedin\.com\/.*$/,
          "Invalid LinkedIn URL",
        ],
      },

      bio: {
        type: String,
        default: "",
      },

      gender: {
        type: String,
        enum: ["Male", "Female", "Prefer not to say", ""],
        default: "",
      },
    },

    professionalInformation: {
      currentRole: {
        type: String,
        default: "",
      },
      targetedRole: {
        type: String,
        default: "",
      },
      experienceLevel: {
        type: String,
        default: "",
      },
      skills: [
        {
          type: String,
        },
      ],
      targetCompanies: [
        {
          type: String,
        },
      ],
    },

    notificationPreference: {
      emailNotification: {
        type: String,
        enum: ["yes", "no"],
        default: "no",
      },
      weeklyProgressReport: {
        type: String,
        enum: ["yes", "no"],
        default: "no",
      },
      practiceReminder: {
        type: String,
        enum: ["yes", "no"],
        default: "no",
      },
      marketingEmails: {
        type: String,
        enum: ["yes", "no"],
        default: "no",
      },
    },
    resumeUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default model("Profile", profileSchema);
