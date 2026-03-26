import { prisma } from "../utils/prisma.js";
import { NotFound } from "../utils/appError.js";

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      githubId: true,
      googleId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw NotFound("User not found");
  }

  return user;
};

export const updateUserById = async (
  userId: string,
  data: { name?: string; avatarUrl?: string },
) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      githubId: true,
      googleId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};
