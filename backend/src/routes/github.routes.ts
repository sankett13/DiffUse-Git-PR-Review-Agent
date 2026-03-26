import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import type { Request, Response } from "express";
import { getInstallationRepos } from "../services/github.service.js";
import {
  connectRepo,
  getLoggedUserRepos,
  disconnectRepo,
} from "../controllers/github.controller.js";

const router = Router();

router.post("/save-installation", async (req: Request, res: Response) => {
  const { installationId } = req.body;

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  await prisma.installation.upsert({
    where: { githubInstallationId: parseInt(installationId) },
    update: { userId },
    create: {
      githubInstallationId: parseInt(installationId),
      userId,
      accountLogin: "Connected",
      accountType: "User",
    },
  });

  res.json({ success: true });
});

router.get("/repos", async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const installation = await prisma.installation.findFirst({
    where: { userId: req.user.id },
  });

  if (!installation) {
    res.json({ repos: [], connected: false });
    return;
  }

  try {
    const repos = await getInstallationRepos(installation.githubInstallationId);
    res.json({ repos, connected: true });
  } catch (error) {
    console.error("Failed to fetch repos:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

router.post("/repos/connect", connectRepo);

router.delete("/repos/:repoId", disconnectRepo);

router.get("/user-repos", getLoggedUserRepos);

export default router;
