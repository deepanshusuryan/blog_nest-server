import User from "../models/User.js";

export async function isSuperAdmin(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized", success: false });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        if (user.role !== "super_admin") {
            return res.status(403).json({ message: "Access denied. Super admin only.", success: false });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}