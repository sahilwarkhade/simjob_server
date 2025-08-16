import express from "express";
import {
  getHistory,
  getRecentSessions,
  getUserProgress,
  getUserStats,
} from "../controllers/DashboardControllers/Dashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/userstats", auth, getUserStats);
router.get("/recentsessions", auth, getRecentSessions);
router.get("/allsessions", auth, getHistory);
router.get("/progress", auth, getUserProgress);

export default router;
