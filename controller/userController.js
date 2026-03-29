import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function createUser(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are rwquired", success: false })
        }
        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name, email, password: hashPassword
        })

        return res.status(201).json({ message: "User created Successfully", success: true, newUser })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function getUser(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false })
        }

        return res.status(200).json({ message: "User fetched successfully", success: true, user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false })
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not registered", success: false });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid Password", success: false })
        }

        const accessToken = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })

        const refreshToken = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" })

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({ message: "Login successful", success: true, accessToken: accessToken })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function refreshAccessToken(req, res) {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(400).send({ message: "No refresh Token", success: false });
        }
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== token) {
            return res.status(403).json({ message: "Invalid refresh token", success: false });
        }

        const newAccessToken = jwt.sign({ email: user?.email, id: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function logoutUser(req, res) {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(204).send(); // already logged out
        }
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
        res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
        return res.status(200).json({ message: "Logged out successfully", success: true });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}