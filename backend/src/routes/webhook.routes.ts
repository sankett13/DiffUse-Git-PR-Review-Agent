import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { addReviewPRJob } from "../queues/index.js";
import crypto from "crypto";

const router = Router();

function verifyGitHubWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-hub-signature-256"] as string;
    const event = req.headers["x-github-event"] as string;
    const deliveryId = req.headers["x-github-delivery"] as string;

    const payload = JSON.stringify(req.body);

    if (process.env.GITHUB_WEBHOOK_SECRET) {
      if (
        !signature ||
        !verifyGitHubWebhook(
          payload,
          signature,
          process.env.GITHUB_WEBHOOK_SECRET,
        )
      ) {
        console.log(`[Webhook] Invalid signature for delivery ${deliveryId}`);
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    console.log(`[Webhook] Received event: ${event}, delivery: ${deliveryId}`);

    if (event === "pull_request") {
      const action = req.body.action;
      const prNumber = req.body.pull_request.number;
      const owner = req.body.repository.owner.login;
      const repo = req.body.repository.name;
      const installationId = req.body.installation?.id;

      if (!installationId) {
        console.log(`[Webhook] No installation ID found for ${owner}/${repo}`);
        return res.status(400).json({ error: "No installation ID" });
      }

      if (
        action === "opened" ||
        action === "synchronize" ||
        action === "reopened"
      ) {
        const repository = await prisma.repository.findUnique({
          where: { githubRepoId: req.body.repository.id },
          include: { installation: true },
        });

        if (!repository) {
          console.log(`[Webhook] Repository ${owner}/${repo} not found in DB`);
          return res.status(200).json({ message: "Repository not tracked" });
        }

        const userId = repository.installation.userId;

        await addReviewPRJob({
          repositoryId: repository.id,
          prNumber,
          owner,
          repo,
          installationId,
          userId,
        });

        console.log(`[Webhook] Queued review for ${owner}/${repo}#${prNumber}`);
        return res.status(200).json({ message: "Review queued" });
      }
    }

    return res.status(200).json({ message: "Event processed" });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/webhook/github", async (req, res) => {
  return router.stack
    .find((layer: any) => layer.route?.path === "/webhook")
    ?.route.stack[0].handle(req, res);
});

export default router;
