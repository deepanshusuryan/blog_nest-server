import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog", required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 500
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;