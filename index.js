import express from "express";
import databaseConnection from "./db/databaseConnection.js";
import { userRouter } from "./routes/userRoutes.js";
import { blogRouter } from "./routes/blogRoutes.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
databaseConnection();
const port = process.env.PORT;
const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/note", blogRouter);

app.listen(8000, () => {
    console.log(`App listening on port ${port}`)
})