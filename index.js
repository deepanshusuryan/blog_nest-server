import express from "express";
import databaseConnection from "./db/databaseConnection.js";
import { userRouter } from "./routes/userRoutes.js";
import { noteRouter } from "./routes/noteRoutes.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
databaseConnection();
const port=process.env.PORT;
const app=express();

app.use(cors());
app.use(express.json());
app.use("/api/user",userRouter);
app.use("/api/note",noteRouter);

app.listen(8000,()=>{
    console.log(`App listening on port ${port}`)
})