import express from 'express';
import { continueWithGoogle, loginUser, registerUser} from '../controllers/Authcontrollers/Auth.controller.js';
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', continueWithGoogle)


export default router;