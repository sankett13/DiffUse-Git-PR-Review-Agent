import { App } from "octokit";
import type { FixPRJobData } from "../queues/index.js";
import { Worker } from "../queues/index.js";
import { prisma } from "../utils/prisma.js";
import { generateFix } from "../lib/aiReviewer.js";

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

const fixPrWorker = new Worker<FixPRJobData>(
  "fix-pr",
  async (job) => {
    const {
      reviewId,
      repositoryId,
      owner,
      repo,
      installationId,
      file,
      line,
      issue,
      currentCode,
    } = job.data;

    console.log(`[Fix PR] Generating fix for ${file}:${line}`);

    try {
      const fix = await generateFix(file, line, issue, currentCode);

      if (!fix) {
        console.log(`[Fix PR] Could not generate fix for ${file}:${line}`);
        return { success: false, reason: "Could not generate fix" };
      }

      const existingFix = await prisma.fixPr.findUnique({
        where: { reviewId },
      });

      if (existingFix) {
        await prisma.fixPr.update({
          where: { reviewId },
          data: {
            diffSummary: `${existingFix.diffSummary || ""}\n\n=== ${file}:${line} ===\n${fix}`,
          },
        });
      } else {
        await prisma.fixPr.create({
          data: {
            reviewId,
            status: "pending",
            diffSummary: `=== ${file}:${line} ===\n${fix}`,
          },
        });
      }

      console.log(`[Fix PR] Generated fix for ${file}:${line}`);
      return { success: true, fix };
    } catch (error) {
      console.error(`[Fix PR] Failed for ${file}:${line}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    concurrency: 3,
  },
);

fixPrWorker.on("completed", (job) => {
  console.log(`[Fix PR] Job ${job.id} completed`);
});

fixPrWorker.on("failed", (job, err) => {
  console.error(`[Fix PR] Job ${job?.id} failed:`, err.message);
});

fixPrWorker.on("error", (err) => {
  console.error("[Fix PR] Worker error:", err);
});

export { fixPrWorker };
