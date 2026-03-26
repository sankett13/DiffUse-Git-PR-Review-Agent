import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { saveRepoToDb, getUserRepos } from "../services/github.service.js";

export async function connectRepo(req: Request, res: Response) {
  const { id, name, full_name, isPrivate, language, description } = req.body;

  if (!req.user?.id) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  console.log("data received", id, name, full_name, isPrivate);

  const installation = await prisma.installation.findFirst({
    where: {
      userId: req.user.id,
    },
  });

  const repo = await saveRepoToDb(
    {
      id,
      name,
      full_name,
      private: isPrivate,
      language: language,
      description: description,
    },
    installation?.id!,
  );

  console.log("repo", repo);

  res.json({ success: true, message: "Repo connected successfully" });
}

export async function getLoggedUserRepos(req: Request, res: Response) {
  if (!req.user?.id) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const userRepos = await getUserRepos(req.user.id);

  res.json({ success: true, repos: userRepos });
}

export async function disconnectRepo(req: Request, res: Response) {
  if (!req.user?.id) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const { repoId } = req.params;

  const installation = await prisma.installation.findFirst({
    where: { userId: req.user.id },
  });

  if (!installation) {
    res.status(404).json({ success: false, message: "Installation not found" });
    return;
  }

  const repo = await prisma.repository.findFirst({
    where: {
      id: repoId,
      installationId: installation.id,
    },
  });

  if (!repo) {
    res.status(404).json({ success: false, message: "Repository not found" });
    return;
  }

  await prisma.codeChunk.deleteMany({
    where: { repositoryId: repoId },
  });

  await prisma.repository.delete({
    where: { id: repoId },
  });

  res.json({ success: true, message: "Repository disconnected successfully" });
}
