import express from "express";
import {createUser, getUser, loginUser, logoutUser, refreshAccessToken} from "../controller/userController.js"

const router= express.Router();

router.post("/create",createUser);
router.post("/login", loginUser);
router.get("/getuser/:id", getUser);
router.put("/updateuser/:id", getUser);
router.post("/refresh-token",refreshAccessToken);
router.post("/logout", logoutUser);

export { router as userRouter };