import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true,
        unique: true
    },
    refreshToken: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ["user", "super_admin", "admin"],
        default: "user"
    }
}, { timestamps: true })

const User = mongoose.model("User", userSchema);

export default User;