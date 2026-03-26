import { App } from "octokit";
import { prisma } from "../utils/prisma.js";
import { mapFile, type FileMap } from "../utils/repoMapper.js";
import { GoogleGenAI } from "@google/genai";

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  contents?: string;
}

export interface SimilarChunk {
  content: string;
  filePath: string;
  chunkName: string;
}

export interface ReviewContext {
  changedFilesContent: string;
  imports: string;
  callers: string;
  similarCode: string;
  diff: string;
}

async function fetchFileContents(
  owner: string,
  repo: string,
  files: ChangedFile[],
  octokit: any
): Promise<Map<string, string>> {
  const contentsMap = new Map<string, string>();

  for (const file of files) {
    if (file.status === "removed") continue;

    try {
      const contentRes = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        { owner, repo, path: file.filename }
      );

      const content = Buffer.from(contentRes.data.content, "base64").toString("utf8");
      contentsMap.set(file.filename, content);
    } catch (error) {
      console.log(`Could not fetch contents for ${file.filename}:`, error);
    }
  }

  return contentsMap;
}

function getImportsFromRepoMap(repoMap: FileMap[], changedFiles: string[]): string {
  const changedFileSet = new Set(changedFiles);
  const relevantImports: string[] = [];

  for (const fileMap of repoMap) {
    if (changedFileSet.has(fileMap.filePath)) {
      for (const imp of fileMap.imports) {
        relevantImports.push(`// ${fileMap.filePath}\n${imp}`);
      }
    }
  }

  return relevantImports.length > 0 ? relevantImports.join("\n\n") : "No imports found for changed files.";
}

function getCallersFromRepoMap(repoMap: FileMap[], changedFiles: string[]): string {
  const changedExports = new Set<string>();
  const changedFileSet = new Set(changedFiles);
  
  for (const fileMap of repoMap) {
    if (changedFileSet.has(fileMap.filePath)) {
      for (const exp of fileMap.exports) {
        changedExports.add(exp);
      }
    }
  }

  if (changedExports.size === 0) return "No exported functions/classes found in changed files.";

  const callers: string[] = [];
  for (const fileMap of repoMap) {
    if (!changedFileSet.has(fileMap.filePath)) {
      for (const imp of fileMap.imports) {
        for (const exp of changedExports) {
          if (imp.includes(exp)) {
            callers.push(`${fileMap.filePath} imports: ${exp}`);
          }
        }
      }
    }
  }

  return callers.length > 0 ? callers.join("\n") : "No external callers found.";
}

async function getSimilarChunks(
  repoId: string,
  diff: string,
  limit: number = 8
): Promise<SimilarChunk[]> {
  try {
    const embedResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [diff],
    });

    const queryEmbedding = embedResponse.embeddings?.[0]?.values;
    if (!queryEmbedding) {
      console.log("No embedding generated for diff");
      return [];
    }

    const vectorString = `[${queryEmbedding.join(",")}]`;

    const similarChunks = await prisma.$queryRaw<
      { content: string; filePath: string; chunkName: string }[]
    >`
      SELECT content, "filePath", "chunkName"
      FROM code_chunks
      WHERE "repositoryId" = ${repoId}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    return similarChunks.map((chunk) => ({
      content: chunk.content,
      filePath: chunk.filePath,
      chunkName: chunk.chunkName,
    }));
  } catch (error) {
    console.error("Error fetching similar chunks:", error);
    return [];
  }
}

export async function buildContext(
  owner: string,
  repo: string,
  repoId: string,
  files: ChangedFile[]
): Promise<ReviewContext> {
  const [ownerName, repoName] = owner && repo ? [owner, repo] : repoId.split("/");
  
  const octokit = await githubApp.getInstallationOctokit(
    (await prisma.repository.findUnique({ where: { id: repoId } }))!.installationId
  );

  const repoRecord = await prisma.repository.findUnique({
    where: { id: repoId },
    select: { repoMap: true, fullName: true },
  });

  const repoMap: FileMap[] = (repoRecord?.repoMap as FileMap[]) || [];
  const changedFiles = files.map((f) => f.filename);

  const contentsMap = await fetchFileContents(ownerName, repoName, files, octokit);

  const changedFilesContent = files
    .filter((f) => contentsMap.has(f.filename))
    .map((f) => {
      const content = contentsMap.get(f.filename)!;
      const mapped = mapFile(f.filename, content, "");
      return `=== FILE: ${f.filename} ===\n${content}`;
    })
    .join("\n\n");

  const imports = getImportsFromRepoMap(repoMap, changedFiles);
  const callers = getCallersFromRepoMap(repoMap, changedFiles);

  const diff = files
    .filter((f) => f.patch)
    .map((f) => `=== FILE: ${f.filename} ===\n${f.patch}`)
    .join("\n\n");

  const similarChunks = await getSimilarChunks(repoId, diff);
  const similarCode = similarChunks
    .map((c) => `// ${c.filePath} - ${c.chunkName}\n${c.content}`)
    .join("\n\n---\n\n");

  return {
    changedFilesContent,
    imports,
    callers,
    similarCode,
    diff,
  };
}
