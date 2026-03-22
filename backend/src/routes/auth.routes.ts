import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Example route for user registration
router.post("/register", asyncHandler(registerUser));

// Example route for user login
router.post("/login", asyncHandler(loginUser));

export default router;
