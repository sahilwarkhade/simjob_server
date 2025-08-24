import express from "express";
import cors from "cors"
const app=express();
import 'dotenv/config'
import connectDB from "./config/DB.js";
import AuthRoutes from "./routes/User.routes.js"
import MockInterviewRoutes from "./routes/MockInterview.routes.js"
import ProfileRoutes from "./routes/Profile.route.js"
import OATestRoutes from "./routes/OATest.route.js"
import DashboardRoutes from "./routes/Dashboard.route.js"
import ContactUsRoutes from './routes/Contactus.route.js'
import { connectCloudinary } from "./config/Cloudinary.js";
import cookieParser from "cookie-parser";

await connectDB();
await connectCloudinary();
const allowedOrigins = [
  'http://localhost:5173', // Your Vite frontend
  // Add your production frontend URL here later
  // 'https://your-production-site.com' 
];

const corsOptions = {
  // The origin property can be a function for dynamic whitelisting
  origin: (origin, callback) => {
    // Check if the incoming origin is in our whitelist.
    // The '!origin' part allows for server-to-server requests or tools like Postman.
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // This is the key part that was missing or incorrect.
  // It tells the browser that the server allows cookies/credentials to be sent.
  credentials: true,
  
  // You might also want to explicitly allow certain headers and methods
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};

// Enable CORS with your specific options for all routes
app.use(cors(corsOptions));
const cookieSecret=process.env.COOKIE_SECRET;
app.use(cookieParser(cookieSecret));
app.use(express.json());

app.use('/api/v1/auth',AuthRoutes);
app.use('/api/v1/user',DashboardRoutes);
app.use('/api/v1/mockinterview',MockInterviewRoutes);
app.use('/api/v1',ContactUsRoutes);
app.use('/api/v1/profile',ProfileRoutes);
app.use('/api/v1/test',OATestRoutes);

app.get('/',(req,res)=>{
    res.send("Hi, I am a simjob server");
})


app.listen(process.env.PORT,async()=>{
    console.log("Server Listening on PORT : ", process.env.PORT)
})