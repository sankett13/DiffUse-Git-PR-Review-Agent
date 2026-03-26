import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import type { ReviewContext } from "./contextBuilder.js";

// Ensure structured output aligns with the established schema
export const ReviewIssueSchema = z.object({
  file: z.string(),
  line: z.number(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  category: z.string(),
  comment: z.string(),
  autoFixable: z.boolean().optional().default(false),
});

export const ReviewResultSchema = z.object({
  issues: z.array(ReviewIssueSchema),
  summary: z.string().optional(),
});

export type ReviewIssue = z.infer<typeof ReviewIssueSchema>;
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

// Initialize the 2.5 Flash model
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.2,
  apiKey: process.env.GEMINI_API_KEY,
});

const reviewPrompt =
  PromptTemplate.fromTemplate(`You are an expert code reviewer. Analyze the following PR changes and provide detailed code review feedback.

=== CHANGED FILES (full content) ===
{changedFilesContent}

=== DIRECT IMPORTS ===
{imports}

=== CALLERS ===
{callers}

=== SIMILAR CODEBASE CONTEXT ===
{similarCode}

=== DIFF ===
{diff}

Review the code changes for:
1. Security vulnerabilities (injection, exposed secrets, insecure patterns)
2. Performance issues (N+1 queries, inefficient algorithms, memory leaks)
3. Best practices violations (error handling, type safety, code style)
4. Logic bugs and edge cases
5. Missing tests or documentation

Guidelines:
- Be specific and actionable in your feedback
- Focus on the most critical issues first
- Mark issues as autoFixable only if you can confidently provide a fix
- Check both added AND removed lines for issues
- Consider the context from similar code in the codebase`);

export async function reviewCode(
  context: ReviewContext,
): Promise<ReviewResult> {
  // Use LangChain's built-in structured output mechanism for Gemini
  const structuredLlm = llm.withStructuredOutput(ReviewResultSchema, {
    name: "review_result",
  });
  const chain = reviewPrompt.pipe(structuredLlm);

  try {
    const result = await chain.invoke({
      changedFilesContent:
        context.changedFilesContent || "No full file content available",
      imports: context.imports || "No imports found",
      callers: context.callers || "No callers found",
      similarCode: context.similarCode || "No similar code found",
      diff: context.diff || "No diff available",
    });

    return result as ReviewResult;
  } catch (error) {
    console.error("AI Review failed:", error);
    return {
      issues: [],
      summary: "Failed to generate review results. Please try again.",
    };
  }
}

export async function generateFix(
  file: string,
  line: number,
  issue: string,
  currentCode: string,
): Promise<string | null> {
  const fixPrompt =
    PromptTemplate.fromTemplate(`You are an expert code fixer. Given the following issue in a file, provide the corrected code.

FILE: {file}
LINE: {line}
ISSUE: {issue}

CURRENT CODE (around line {line}):
{currentCode}

Provide ONLY the fixed code snippet. Do not include any explanations or markdown syntax (e.g., \`\`\`typescript). Just the raw code text.`);

  const fixLlm = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.5-flash",
    temperature: 0.1,
    apiKey: process.env.GEMINI_API_KEY,
  });

  const chain = fixPrompt.pipe(fixLlm);

  try {
    const response = await chain.invoke({
      file,
      line: line.toString(),
      issue,
      currentCode,
    });

    const text =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Strip surrounding markdown code block markers if the AI includes them anyway
    return text
      .replace(/^```[a-z]*\n/g, "")
      .replace(/\n```$/g, "")
      .trim();
  } catch (error) {
    console.error("Failed to generate code fix:", error);
    return null;
  }
}
