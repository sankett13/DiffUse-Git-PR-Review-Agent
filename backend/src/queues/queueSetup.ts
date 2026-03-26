import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

export const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

export const connection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const REVIEW_PR_QUEUE_NAME = "review-pr";
export const FIX_PR_QUEUE_NAME = "fix-pr";

export const reviewPrQueue = new Queue(REVIEW_PR_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const fixPrQueue = new Queue(FIX_PR_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
});

export interface ReviewPRJobData {
  repositoryId: string;
  prNumber: number;
  owner: string;
  repo: string;
  installationId: number;
  userId: string;
}

export interface FixPRJobData {
  reviewId: string;
  repositoryId: string;
  owner: string;
  repo: string;
  installationId: number;
  file: string;
  line: number;
  issue: string;
  currentCode: string;
}

export async function addReviewPRJob(data: ReviewPRJobData): Promise<Job> {
  return await reviewPrQueue.add("review-pr", data, {
    jobId: `${data.repositoryId}-${data.prNumber}`,
  });
}

export async function addFixPRJob(data: FixPRJobData): Promise<Job> {
  return await fixPrQueue.add("fix-pr", data);
}

export { Worker, Job };
