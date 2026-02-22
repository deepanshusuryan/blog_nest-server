import express from "express";
import {createUser, getUser, loginUser} from "../controller/userController.js"

const router= express.Router();

router.post("/create",createUser);
router.post("/login", loginUser);
router.get("/getuser/:id", getUser);

export { router as userRouter };