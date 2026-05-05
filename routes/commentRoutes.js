import express from "express";
import { addComment, getComments, getReplies, deleteComment, toggleCommentLike } from "../controller/commentController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:blogId", isAuthenticated, addComment);
router.get("/:blogId", isAuthenticated, getComments);
router.get("/:commentId/replies", isAuthenticated, getReplies);
router.delete("/:commentId", isAuthenticated, deleteComment);
router.post("/:commentId/like", isAuthenticated, toggleCommentLike);

export {router as commentRouter};