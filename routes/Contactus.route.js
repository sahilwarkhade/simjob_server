import express from "express";
import { contactUsController } from "../controllers/Contact/Contact.controller.js";
const router = express.Router();

router.post("/contact", contactUsController);

export default router;
