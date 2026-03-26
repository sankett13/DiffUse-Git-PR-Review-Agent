import { App } from "octokit";
import type { ReviewPRJobData } from "../queues/index.js";
import { Worker } from "../queues/index.js";
import { prisma } from "../utils/prisma.js";
import { buildContext } from "../lib/contextBuilder.js";
import { reviewCode, type ReviewIssue } from "../lib/aiReviewer.js";
import { postPRReview } from "../lib/githubComments.js";
import { addFixPRJob } from "../queues/index.js";

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

const reviewPrWorker = new Worker<ReviewPRJobData>(
  "review-pr",
  async (job) => {
    const { repositoryId, prNumber, owner, repo, installationId, userId } =
      job.data;

    console.log(`[Review PR] Starting review for ${owner}/${repo}#${prNumber}`);

    try {
      const review = await prisma.review.create({
        data: {
          repositoryId,
          userId,
          prNumber,
          status: "in_progress",
        },
      });

      const octokit = await githubApp.getInstallationOctokit(installationId);

      const filesRes = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        { owner, repo, pull_number: prNumber },
      );

      const changedFiles = filesRes.data.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
      }));

      const repoRecord = await prisma.repository.findUnique({
        where: { id: repositoryId },
        include: { installation: true },
      });

      if (!repoRecord) {
        throw new Error(`Repository ${repositoryId} not found`);
      }

      const context = await buildContext(
        owner,
        repo,
        repositoryId,
        changedFiles,
      );
      const reviewResult = await reviewCode(context);

      const issuesWithLines = reviewResult.issues.map((issue) => ({
        ...issue,
        line: issue.line > 0 ? issue.line : 1,
      }));

      await postPRReview(
        installationId,
        owner,
        repo,
        prNumber,
        issuesWithLines,
        reviewResult.summary,
      );

      const autoFixableIssues = issuesWithLines.filter((i) => i.autoFixable);
      for (const issue of autoFixableIssues) {
        const fileContent = context.changedFilesContent
          .split("=== FILE:")
          .find((f) => f.includes(issue.file));

        await addFixPRJob({
          reviewId: review.id,
          repositoryId,
          owner,
          repo,
          installationId,
          file: issue.file,
          line: issue.line,
          issue: issue.comment,
          currentCode: fileContent || "",
        });
      }

      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "completed",
          prTitle: `PR #${prNumber}`,
          summary: reviewResult.summary,
          fileCount: changedFiles.length,
          commentCount: issuesWithLines.length,
        },
      });

      console.log(
        `[Review PR] Completed review for ${owner}/${repo}#${prNumber}`,
      );
      return {
        success: true,
        reviewId: review.id,
        issuesCount: issuesWithLines.length,
      };
    } catch (error) {
      console.error(
        `[Review PR] Failed for ${owner}/${repo}#${prNumber}:`,
        error,
      );

      await prisma.review.update({
        where: {
          repositoryId_prNumber: {
            repositoryId,
            prNumber,
          },
        },
        data: {
          status: "failed",
        },
      });

      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    concurrency: 5,
  },
);

reviewPrWorker.on("completed", (job) => {
  console.log(`[Review PR] Job ${job.id} completed successfully`);
});

reviewPrWorker.on("failed", (job, err) => {
  console.error(`[Review PR] Job ${job?.id} failed:`, err.message);
});

reviewPrWorker.on("error", (err) => {
  console.error("[Review PR] Worker error:", err);
});

export { reviewPrWorker };
