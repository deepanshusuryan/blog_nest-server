import express from "express";
import databaseConnection from "./db/databaseConnection.js";
import { userRouter } from "./routes/userRoutes.js";
import { blogRouter } from "./routes/blogRoutes.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { categoryRoutes } from "./routes/blogCategoryRoutes.js";

dotenv.config();
databaseConnection();
const port = process.env.PORT;
const app = express();

app.use(cors({
    origin:[
        process.env.NEXT_PUBLIC_FRONTEND_URL,
        "http://localhost:3000"
    ],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/blog", blogRouter);
app.use("/api/category", categoryRoutes);

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})