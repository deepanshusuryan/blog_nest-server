import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export async function isAuthenticated(req, res, next) {
    const auth = req.headers["authorization"];
    try {
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized Access , access token is required" })
        }
        const decoded = jwt.verify(auth, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("Auth error", error);
        return res.status(401).json({ message: "Unauthorized Access, jwt token wrong or expired" });
    }
}   