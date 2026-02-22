import express from "express";
import { createNote, deleteNote, getNote, getNotes, updateNote } from "../controller/noteController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createNote);
router.get("/allnotes", isAuthenticated, getNotes);
router.get("/getnote/:id", isAuthenticated, getNote);
router.put("/update/:id", isAuthenticated, updateNote);
router.delete("/delete/:id", isAuthenticated, deleteNote);

export { router as noteRouter }