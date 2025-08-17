import express from 'express';
import { loginUser, registerUser, updatePassword } from '../controllers/Authcontrollers/Auth.controller.js';
import auth from "../middlewares/auth.middleware.js"
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/changepassword',auth, updatePassword)


export default router;