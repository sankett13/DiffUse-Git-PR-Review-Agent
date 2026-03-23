import { App } from "octokit";

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

export async function getInstallationRepos(installationId: number) {
  const octokit = await githubApp.getInstallationOctokit(installationId);
  const { data } = await octokit.request("GET /installation/repositories");
  return data.repositories;
}
