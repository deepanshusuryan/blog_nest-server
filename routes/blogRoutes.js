import express from "express";
import { createBlog, deleteBlog, getBlog, getBlogs, getBlogsByUser, toggleBlogType, updateBlog } from "../controller/blogController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createBlog);
router.get("/getblogs", isAuthenticated, getBlogs);
router.get("/getblog/:id", isAuthenticated, getBlog);
router.put("/update/:id", isAuthenticated, updateBlog);
router.put("/delete/:id", isAuthenticated, deleteBlog);
router.get("/getuserblogs/:userId", isAuthenticated, getBlogsByUser);
router.put("/toggle-blogtype/:blogId", isAuthenticated, toggleBlogType);

export { router as blogRouter }