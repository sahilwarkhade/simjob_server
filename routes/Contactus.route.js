import express from "express";
import { contactUsController } from "../controllers/Contact/Contact.controller";
const router=express.Router()

router.post('/contactus', contactUsController);

export default router