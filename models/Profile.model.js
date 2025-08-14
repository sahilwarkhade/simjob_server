import { model, Schema } from "mongoose";

const profileSchema = new Schema({
  avatar: {
    type: String,
  },
  resumeUrl: {
    type: String,
  },
  targetRoles: [{ type: String }],
  bio: {
    type: String,
  },
  gender: {
    type: String,
  },
});

export default model("Profile", profileSchema);
