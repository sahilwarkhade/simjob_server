import express from "express";
import {
  deleteAccount,
  getUserProfileDetails,
  updateProfile,
  updateUserPersonalDetailes,
  updateUserProfessionalDetailes,
} from "../controllers/ProfileControllers/Profile.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../config/multerFileUpload.js";

const router = express.Router();

router.get("/getuserdetails", auth, getUserProfileDetails);
router.post("/update/personaldetailes", auth, updateUserPersonalDetailes);
router.post(
  "/update/professionaldetailes",
  auth,
  updateUserProfessionalDetailes
);
router.post("/update/avatar", auth, upload.single("profile"), updateProfile);
router.post("/deleteaccount", auth, deleteAccount);

export default router;
