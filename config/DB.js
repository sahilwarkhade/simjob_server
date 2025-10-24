import mongoose from "mongoose";

export default async function connectDB(URL){
    try{
        await mongoose.connect(process.env.DATABASE_URL || URL);
        console.log("DB connected successfully")
    }
    catch(err){
        console.log("There is an error in connecting DB", err.message);
    }
};