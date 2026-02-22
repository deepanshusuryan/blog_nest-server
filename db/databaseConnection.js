import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const momgoUri = process.env.MONGO_URI;
async function databaseConnection() {
    try {
        mongoose.connect(momgoUri);
        console.log(`
                    -----------------------------------
                    | Database connected successfully |
                    -----------------------------------`)
    } catch (error) {
        console.error("Database connection failed", error.message);
    }
}

export default databaseConnection;