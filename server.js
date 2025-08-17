import express from "express";
const app=express();
import 'dotenv/config'
import connectDB from "./config/DB.js";
import UserRoutes from "./routes/User.routes.js"
import MockInterviewRoutes from "./routes/MockInterview.routes.js"
import ProfileRoute from "./routes/Profile.route.js"
import DashboardRoutes from "./routes/Dashboard.route.js"
import ContactUsRoute from './routes/Contactus.route.js'
import { connectCloudinary } from "./config/Cloudinary.js";

await connectDB();
await connectCloudinary();
app.use(express.json());

app.use('/api/v1/user',UserRoutes);
app.use('/api/v1/user',DashboardRoutes);
app.use('/api/v1/mockinterview',MockInterviewRoutes);
app.use('/api/v1',ContactUsRoute);
app.use('/api/v1/profile',ProfileRoute);

app.get('/',(req,res)=>{
    res.send("Hi, I am a simjob server");
})


app.listen(process.env.PORT,async()=>{
    console.log("Server Listening on PORT : ", process.env.PORT)
})