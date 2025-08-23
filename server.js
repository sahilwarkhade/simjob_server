import express from "express";
const app=express();
import 'dotenv/config'
import connectDB from "./config/DB.js";
import UserRoutes from "./routes/User.routes.js"
import MockInterviewRoutes from "./routes/MockInterview.routes.js"
import ProfileRoutes from "./routes/Profile.route.js"
import OATestRoutes from "./routes/OATest.route.js"
import DashboardRoutes from "./routes/Dashboard.route.js"
import ContactUsRoutes from './routes/Contactus.route.js'
import { connectCloudinary } from "./config/Cloudinary.js";
import cookieParser from "cookie-parser";

await connectDB();
await connectCloudinary();

const cookieSecret=process.env.COOKIE_SECRET;
app.use(cookieParser(cookieSecret));
app.use(express.json());

app.use('/api/v1/user',UserRoutes);
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