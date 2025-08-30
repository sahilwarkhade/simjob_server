import express from "express";
import {
  continueWithGitHub,
  continueWithGoogle,
  forgetPassword,
  loginUser,
  logOut,
  registerUser,
  sendOtp,
  updatePassword,
  verifyOtp,
} from "../controllers/Authcontrollers/Auth.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", continueWithGoogle);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forget-password", forgetPassword);
router.get("/github/callback", continueWithGitHub);
router.post("/logout", auth, logOut);
router.post("/update-password", auth, updatePassword);

export default router;
