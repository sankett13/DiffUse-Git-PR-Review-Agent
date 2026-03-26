import { App } from "octokit";
import { prisma } from "../utils/prisma.js";
import { triggerChunkingPipeline } from "./chunking.service.js";

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

export async function getInstallationRepos(installationId: number) {
  const octokit = await githubApp.getInstallationOctokit(installationId);
  const { data } = await octokit.request("GET /installation/repositories");
  return data.repositories;
}

export async function saveRepoToDb(
  data: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    language: string | null;
    description: string | null;
  },
  installationId: string,
) {
  const repo = await prisma.repository.upsert({
    where: {
      githubRepoId: data.id,
    },
    update: {
      name: data.name,
      fullName: data.full_name,
      private: data.private,
      language: data.language,
      description: data.description,
      installationId,
    },
    create: {
      githubRepoId: data.id,
      name: data.name,
      fullName: data.full_name,
      private: data.private,
      language: data.language,
      description: data.description,
      installationId,
    },
  });

  // Kick off chunking in the background (fire and forget)
  triggerChunkingPipeline(repo.id).catch(err => {
    console.error(`Failed to trigger chunking pipeline:`, err);
  });

  return repo;
}

export async function getUserRepos(userId: string) {
  const installation = await prisma.installation.findFirst({
    where: {
      userId: userId,
    },
  });

  if (!installation) {
    return [];
  }

  const userRepos = await prisma.repository.findMany({
    where: {
      installationId: installation.id,
    },
  });

  return userRepos;
}
