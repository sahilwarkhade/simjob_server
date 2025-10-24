import express from "express";
import {
  getHistory,
  getRecentSessions,
  getUserProgress,
  getUserStats,
} from "../controllers/DashboardControllers/Dashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/stats", auth, getUserStats);
router.get("/recentsessions", auth, getRecentSessions);
router.get("/history", auth, getHistory);
router.get("/progress", auth, getUserProgress);

export default router;
