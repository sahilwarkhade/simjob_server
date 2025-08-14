import express from 'express';
import { loginUser, registerUser } from '../controllers/authcontrollers/auth.controllers.js';

const router = express.Router();

// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

export default router;