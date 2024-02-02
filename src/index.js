import { app } from "./app.js";
import mongoose from "mongoose";

const connect=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to database");
    } catch (error) {
        console.log(error);
    }
}
mongoose.connection.on("disconnect",()=>{
    console.log("MongoDB disconnected")
})
app.listen(process.env.PORT,()=>{
    connect();
    console.log(`Server is running on port ${process.env.PORT}`)
})
