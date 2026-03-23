import type { NextFunction, Request, Response } from "express";
import { BadRequest } from "../utils/appError.js";
import type { LoginUser, RegisterUser } from "../types/auth.types.js";
import {
  registerUser as registerUserService,
  loginUser as loginUserService,
} from "../services/auth.service.js";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password }: RegisterUser = req.body;
    console.log("Received registration data:", { name, email, password });

    if (!email || !password) {
      throw BadRequest("Email and password are required");
    }

    const newUser = await registerUserService({ name, email, password });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password }: LoginUser = req.body;
    console.log("Received login data:", { email, password });

    if (!email || !password) {
      throw BadRequest("Email and password are required");
    }

    // Handle user login logic here
    const { user, accessToken } = await loginUserService({ email, password });

    res.status(200).json({
      success: true,
      message: "User logged in successfully!",
      data: user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};
