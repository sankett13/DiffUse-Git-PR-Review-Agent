import { App } from "octokit";
import type { ReviewIssue } from "./aiReviewer.js";

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

export interface PRReviewComment {
  path: string;
  line: number;
  body: string;
}

const severityEmoji: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
  info: "ℹ️",
};

export async function postPRReview(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number,
  issues: ReviewIssue[],
  summary?: string
): Promise<{ success: boolean; reviewId?: string }> {
  try {
    const octokit = await githubApp.getInstallationOctokit(installationId);

    const reviewComments = issues.map((issue) => {
      const emoji = severityEmoji[issue.severity] || "ℹ️";
      const body = `${emoji} **[${issue.severity.toUpperCase()}]** ${issue.category}\n\n${issue.comment}${issue.autoFixable ? "\n\n> ⚠️ This issue may be auto-fixable" : ""}`;

      return {
        path: issue.file,
        line: issue.line,
        body,
      };
    });

    const reviewBody = summary || generateReviewSummary(issues);

    await octokit.request("POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews", {
      owner,
      repo,
      pull_number: prNumber,
      body: reviewBody,
      event: issues.length > 0 ? "COMMENT" : "APPROVE",
      comments: reviewComments,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to post PR review:", error);
    return { success: false };
  }
}

function generateReviewSummary(issues: ReviewIssue[]): string {
  if (issues.length === 0) {
    return "✅ No issues found. This PR looks good!";
  }

  const counts = {
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
    info: issues.filter((i) => i.severity === "info").length,
  };

  const lines = ["## 🔍 Code Review Summary\n"];
  
  if (counts.critical > 0) {
    lines.push(`🔴 **${counts.critical} critical** issue(s) found`);
  }
  if (counts.high > 0) {
    lines.push(`🟠 **${counts.high} high** severity issue(s) found`);
  }
  if (counts.medium > 0) {
    lines.push(`🟡 **${counts.medium} medium** severity issue(s) found`);
  }
  if (counts.low > 0) {
    lines.push(`🟢 **${counts.low} low** severity issue(s) found`);
  }
  if (counts.info > 0) {
    lines.push(`ℹ️ **${counts.info} info** note(s)`);
  }

  lines.push("\n---\n");
  lines.push("Review performed by DiffUse AI");

  return lines.join("\n");
}

export async function getPRDetails(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{ title: string; body: string; user: string } | null> {
  try {
    const octokit = await githubApp.getInstallationOctokit(installationId);
    
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      { owner, repo, pull_number: prNumber }
    );

    return {
      title: data.title,
      body: data.body || "",
      user: data.user.login,
    };
  } catch (error) {
    console.error("Failed to get PR details:", error);
    return null;
  }
}
