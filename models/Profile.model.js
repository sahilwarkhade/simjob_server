import { model, Schema } from "mongoose";

const profileSchema = new Schema({
  personalInformation: {
    mobileNumber: {
      type: String,
      default:""
    },
    address: {
      type: String,
      default:""
    },
    website: {
      type: String,
      default:""
    },
    linkedinUrl: {
      type: String,
      default:""
    },
    bio: {
      type: String,
      default:""
    },
    gender: {
      type: String,
      default:""
    },
  },

  professionalInformation: {
    currentRole: {
      type: String,
      default:""
    },
    targetedRole: {
      type: String,
      default:""
    },
    experienceLevel: {
      type: String,
      default:""
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
      default:'no'
    },
    weeklyProgressReport:{
      type:String,
      enum:['yes','no'],
      default:'no'
    },
    practiceReminder:{
      type:String,
      enum:['yes','no'],
      default:'no'
    },
    marketingEmails:{
      type:String,
      enum:['yes','no'],
      default:'no'
    }
  },
  resumeUrl: {
    type: String,
    default:""
  },
},{timestamps:true});

export default model("Profile", profileSchema);
