import express from 'express';
import { continueWithGitHub, continueWithGoogle, forgetPassword, loginUser, registerUser, sendOtp, verifyOtp} from '../controllers/Authcontrollers/Auth.controller.js';
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', continueWithGoogle)
router.post('/send-otp', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/forget-password', forgetPassword)
router.get('/github/callback', continueWithGitHub)


export default router;