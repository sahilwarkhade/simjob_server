import { model, Schema } from "mongoose";

const profileSchema = new Schema({
  personalInformation: {
    avatar: {
      type: String,
    },
    mobileNumber: {
      type: Number,
    },
    address: {
      type: String,
    },
    website: {
      type: String,
    },
    linkedinUrl: {
      type: String,
    },
    bio: {
      type: String,
    },
    gender: {
      type: String,
    },
  },

  professionalInformation: {
    currentRole: {
      type: String,
    },
    targetedRole: {
      type: String,
    },
    experienceLevel: {
      type: String,
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

  notificationPreference:{
    emailNotification:{
      type:String,
      enum:['yes','no'],
      required:true,
    },
    weeklyProgressReport:{
      type:String,
      enum:['yes','no'],
    },
    practiceReminder:{
      type:String,
      enum:['yes','no'],
    },
    marketingEmails:{
      type:String,
      enum:['yes','no'],
    }
  },
  resumeUrl: {
    type: String,
  },
});

export default model("Profile", profileSchema);
