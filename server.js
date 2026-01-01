import express from "express";
import "dotenv/config.js";
import cors from "cors";
import connectDB from "./config/DB.js";
import AuthRoutes from "./routes/Auth.route.js";
import MockInterviewRoutes from "./routes/MockInterview.routes.js";
import ProfileRoutes from "./routes/Profile.route.js";
import OATestRoutes from "./routes/OATest.route.js";
import DashboardRoutes from "./routes/Dashboard.route.js";
import ContactUsRoutes from "./routes/Contactus.route.js";
import { connectCloudinary } from "./config/cloudinary.js";
import cookieParser from "cookie-parser";
import http from "http";
import auth from "./middlewares/auth.middleware.js";
import { connectWebSocket } from "./websockets/connectWebSocket.js";
import helmet from "helmet";

const app = express();
const server = http.createServer(app);
await connectDB();
await connectCloudinary();

app.use(helmet());

const allowedOrigins = [
  "http://localhost:4173",
  "http://localhost:5173",
  "https://simjob.space",
  "http://simjob.space",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

app.use(cors(corsOptions));
const cookieSecret = process.env.COOKIE_SECRET;
app.use(cookieParser(cookieSecret));
app.use(express.json());

app.use("/api/v1/check", auth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Already logged in",
  });
});
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", DashboardRoutes);
app.use("/api/v1/interview", MockInterviewRoutes);
app.use("/api/v1", ContactUsRoutes);
app.use("/api/v1/user/profile", ProfileRoutes);
app.use("/api/v1/test", OATestRoutes);

app.get("/", (req, res) => {
  res.send("Hi, I am a simjob server");
});

connectWebSocket(server);

server.listen(process.env.PORT, "0.0.0.0", async () => {
  console.log("Server Listening on PORT : ", process.env.PORT);
});
