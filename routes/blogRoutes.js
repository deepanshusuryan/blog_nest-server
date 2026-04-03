import express from "express";
import { createBlog, deleteBlog, getBlog, getBlogs, updateBlog } from "../controller/blogController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createBlog);
router.get("/allblogs", isAuthenticated, getBlogs);
router.get("/getblog/:id", isAuthenticated, getBlog);
router.put("/update", isAuthenticated, updateBlog);
router.delete("/delete/:id", isAuthenticated, deleteBlog);

export { router as blogRouter }