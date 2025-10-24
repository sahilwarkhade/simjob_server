import express from "express";
import {
  deleteAccount,
  getUserProfileDetails,
  updateProfile,
  updateUserPersonalDetails,
  updateUserProfessionalDetails,
} from "../controllers/ProfileControllers/Profile.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/getuserdetails", auth, getUserProfileDetails);
router.post("/update/personaldetails", auth, updateUserPersonalDetails);
router.post("/update/professionaldetails", auth, updateUserProfessionalDetails);
router.post(
  "/update/avatar",
  upload.single("profileImage"),
  auth,
  updateProfile
);
router.delete("/deleteaccount", auth, deleteAccount);

export default router;
