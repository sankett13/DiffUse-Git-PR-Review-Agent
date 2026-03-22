import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.js";
import { BadRequest } from "../utils/appError.js";
import type { LoginUser, RegisterUser } from "../types/auth.types.js";

export const registerUser = async (userData: RegisterUser) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    // Operational error that should be shown to client
    throw BadRequest("Email already in use");
  }

  // 1. Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  // 2. Create the entry in the DB
  // Use 'return' so the controller gets the created user back
  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
    },
  });

  return newUser;
};

export const loginUser = async (userData: LoginUser) => {
  const user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (!user) {
    throw BadRequest("Invalid email or password");
  }
  console.log(userData.email, userData.password);
  const passwordMatch = await bcrypt.compare(
    userData.password,
    user.password?.toString() || "",
  );
  console.log("Password match:", passwordMatch);

  if (!passwordMatch) {
    throw BadRequest("Invalid email or password");
  }

  return user;
};
