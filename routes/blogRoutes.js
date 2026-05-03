import express from "express";
import { createBlog, deleteBlog, getBlog, getBlogs, getSavedBlogs, toggleBlogType, toggleLike, toggleSaveBlog, updateBlog } from "../controller/blogController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createBlog);
router.get("/getblogs", isAuthenticated, getBlogs);
router.get("/getblog/:id", isAuthenticated, getBlog);
router.put("/update/:id", isAuthenticated, updateBlog);
router.put("/delete/:id", isAuthenticated, deleteBlog);
router.put("/toggle-blogtype/:blogId", isAuthenticated, toggleBlogType);
router.post("/:id/like", isAuthenticated, toggleLike);
router.post("/save/:blogId", isAuthenticated, toggleSaveBlog);
router.get("/savedblogs",isAuthenticated, getSavedBlogs);

export { router as blogRouter }