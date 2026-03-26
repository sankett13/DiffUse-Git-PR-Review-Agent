import express from "express";
import { getMe, updateMe } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/me", authMiddleware, asyncHandler(getMe));
router.patch("/me", authMiddleware, asyncHandler(updateMe));

export default router;
