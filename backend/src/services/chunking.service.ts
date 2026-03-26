import { App } from "octokit";
import { prisma } from "../utils/prisma.js";
import {
  mapFile,
  type FileMap,
  type CodeChunkMap,
} from "../utils/repoMapper.js";
import { GoogleGenAI } from "@google/genai";

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Triggers the entire chunking pipeline for a repository.
 */
export async function triggerChunkingPipeline(repoId: string) {
  let repoNameForLog = "unknown_repo";
  try {
    const repoRecord = await prisma.repository.findUnique({
      where: { id: repoId },
      include: { installation: true },
    });
    if (!repoRecord) {
      console.error(`[Chunking] Repo not found for id: ${repoId}`);
      return;
    }

    const { fullName, name: repoName, defaultBranch } = repoRecord;
    repoNameForLog = repoName;
    const owner = fullName.split("/")[0]!;
    const githubInstallationId = repoRecord.installation.githubInstallationId;

    // 1. Fetch File Tree
    console.log(`[Chunking] Fetching file tree for ${owner}/${repoName}...`);
    const octokit =
      await githubApp.getInstallationOctokit(githubInstallationId);

    // Get the tree recursively
    const treeRes = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      {
        owner,
        repo: repoName,
        tree_sha: defaultBranch,
        recursive: "1",
      },
    );

    const items = treeRes.data.tree;
    // Filter for ts, js, py
    const supportedExtensions = [".ts", ".js", ".py", ".tsx", ".jsx"];
    const codeFiles = items.filter(
      (item) =>
        item.type === "blob" &&
        item.path &&
        supportedExtensions.some((ext) => item.path!.endsWith(ext)),
    );

    console.log(
      `[Chunking] Found ${codeFiles.length} code files. Fetching contents...`,
    );

    const fileMaps: FileMap[] = [];
    const allChunks: (CodeChunkMap & { filePath: string; fileSha: string })[] =
      [];

    // Process files (we could batch these to avoid rate limits, but for now we do sequentially or small Promise.all)
    for (const file of codeFiles) {
      if (!file.path || !file.sha) continue;

      const blobRes = await octokit.request(
        "GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
        {
          owner,
          repo: repoName,
          file_sha: file.sha,
        },
      );

      // blob content is base64 encoded
      const content = Buffer.from(blobRes.data.content, "base64").toString(
        "utf8",
      );

      // 2. Map file using repoMapper
      const mapped = mapFile(file.path, content, file.sha);
      fileMaps.push(mapped);

      // Collect chunks
      for (const chunk of mapped.chunks) {
        allChunks.push({
          ...chunk,
          filePath: mapped.filePath,
          fileSha: mapped.fileSha,
        });
      }
    }

    // 3. Save repo map to Repository table
    console.log(`[Chunking] Saving repo map with ${fileMaps.length} files...`);
    await prisma.repository.update({
      where: { id: repoId },
      data: {
        repoMap: fileMaps as any,
        status: "ready", // Finished parsing, now generating embeddings (or do it after)
      },
    });

    // 4. Batch embed and save chunks
    console.log(
      `[Chunking] Generating embeddings for ${allChunks.length} chunks via Gemini...`,
    );

    const BATCH_SIZE = 100;
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const contents = batch.map((c) => c.content);

      // Call Gemini text-embedding-004
      const embedResponse = await ai.models.embedContent({
        // Change the model name here
        model: "gemini-embedding-001",
        contents,
      });

      // Gemini sometimes returns `embeddings` as an array
      const embeddings = embedResponse.embeddings;

      if (!embeddings || embeddings.length !== batch.length) {
        console.error(`[Chunking] Embedding length mismatch or failed.`);
        continue;
      }

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j]!;
        const vectorValues = embeddings[j]?.values; // Array of numbers

        if (!vectorValues) continue;

        const vectorString = `[${vectorValues.join(",")}]`;

        await prisma.$executeRaw`
          INSERT INTO code_chunks (
             id, "repositoryId", "chunkName", "chunkType", "filePath", "content", "startLine", "endLine", "fileSha", "embedding", "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            ${repoId},
            ${chunk.chunkName},
            ${chunk.chunkType},
            ${chunk.filePath},
            ${chunk.content},
            ${chunk.startLine},
            ${chunk.endLine},
            ${chunk.fileSha},
            ${vectorString}::vector,
            now()
          )
        `;
      }

      console.log(
        `[Chunking] Saved batch ${Math.ceil(i / BATCH_SIZE) + 1} of ${Math.ceil(allChunks.length / BATCH_SIZE)}`,
      );
    }

    console.log(
      `[Chunking] Pipeline completed successfully for ${owner}/${repoName}.`,
    );
  } catch (error) {
    console.error(`[Chunking] Pipeline failed for ${repoNameForLog}:`, error);
    await prisma.repository.update({
      where: { id: repoId },
      data: { status: "failed" },
    });
  }
}
