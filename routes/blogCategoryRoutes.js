import express from 'express'
import { createCategory, getCategories, getCategory, toggleCategoryStatus, updateCategory } from '../controller/blogCategoryController.js';
import { isSuperAdmin } from '../middleware/isAdminMiddleware.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/create", isAuthenticated, isSuperAdmin, createCategory);
router.get("/getcategories", isAuthenticated, getCategories);
router.get("/getcategory", isAuthenticated, isSuperAdmin, getCategory);
router.put("/update", isAuthenticated, isSuperAdmin, updateCategory);
router.put("/status", isAuthenticated, isSuperAdmin, toggleCategoryStatus);

export {router as categoryRoutes}