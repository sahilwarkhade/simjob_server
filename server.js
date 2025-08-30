import express from "express";
import cors from "cors"
const app=express();
import 'dotenv/config'
import connectDB from "./config/DB.js";
import AuthRoutes from "./routes/Auth.route.js"
import MockInterviewRoutes from "./routes/MockInterview.routes.js"
import ProfileRoutes from "./routes/Profile.route.js"
import OATestRoutes from "./routes/OATest.route.js"
import DashboardRoutes from "./routes/Dashboard.route.js"
import ContactUsRoutes from './routes/Contactus.route.js'
import { connectCloudinary } from "./config/Cloudinary.js";
import cookieParser from "cookie-parser";
import { checkLogin } from "./middlewares/check.middleware.js";

await connectDB();
await connectCloudinary();

const allowedOrigins = [
  'http://localhost:4173',
  'http://localhost:5173', 
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};

app.use(cors(corsOptions));
const cookieSecret=process.env.COOKIE_SECRET;
app.use(cookieParser(cookieSecret));
app.use(express.json());

app.use('/api/v1/check',checkLogin)
app.use('/api/v1/auth',AuthRoutes);
app.use('/api/v1/user',DashboardRoutes);
app.use('/api/v1/mockinterview',MockInterviewRoutes);
app.use('/api/v1',ContactUsRoutes);
app.use('/api/v1/user/profile',ProfileRoutes);
app.use('/api/v1/test',OATestRoutes);

app.get('/',(req,res)=>{
    res.send("Hi, I am a simjob server");
})


app.listen(process.env.PORT,async()=>{
    console.log("Server Listening on PORT : ", process.env.PORT)
})