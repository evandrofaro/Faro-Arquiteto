import { Router, type IRouter } from "express";
import {
  GetGithubStatusResponse,
  ListGithubReposResponse,
  ListRepoContentsParams,
  ListRepoContentsResponse,
  FetchFileContentBody,
  FetchFileContentResponse,
  UpdateFileContentBody,
  UpdateFileContentResponse,
  ListDirContentsBody,
  ListDirContentsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getGithubToken(): string | null {
  return process.env.GITHUB_TOKEN ?? null;
}

async function githubFetch(path: string, token: string, options: RequestInit = {}) {
  const url = `https://api.github.com${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  return response.json();
}

router.get("/github/status", async (req, res): Promise<void> => {
  const token = getGithubToken();
  if (!token) {
    const result = GetGithubStatusResponse.parse({
      connected: false,
      username: null,
      avatarUrl: null,
    });
    res.json(result);
    return;
  }

  try {
    const user = (await githubFetch("/user", token)) as {
      login: string;
      avatar_url: string;
    };
    const result = GetGithubStatusResponse.parse({
      connected: true,
      username: user.login,
      avatarUrl: user.avatar_url,
    });
    res.json(result);
  } catch (err) {
    req.log.warn({ err }, "GitHub status check failed");
    const result = GetGithubStatusResponse.parse({
      connected: false,
      username: null,
      avatarUrl: null,
    });
    res.json(result);
  }
});

router.get("/github/repos", async (req, res): Promise<void> => {
  const token = getGithubToken();
  if (!token) {
    res.status(401).json({ error: "GitHub token not configured. Add GITHUB_TOKEN to your environment secrets." });
    return;
  }

  try {
    const repos = (await githubFetch(
      "/user/repos?sort=updated&per_page=50&type=all",
      token
    )) as Array<{
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      private: boolean;
      language: string | null;
      updated_at: string;
    }>;

    const result = ListGithubReposResponse.parse(
      repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        private: r.private,
        language: r.language,
        updatedAt: r.updated_at,
      }))
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list GitHub repos");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

router.get("/github/repos/:owner/:repo/contents", async (req, res): Promise<void> => {
  const rawOwner = Array.isArray(req.params.owner) ? req.params.owner[0] : req.params.owner;
  const rawRepo = Array.isArray(req.params.repo) ? req.params.repo[0] : req.params.repo;

  const parsed = ListRepoContentsParams.safeParse({ owner: rawOwner, repo: rawRepo });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const token = getGithubToken();
  if (!token) {
    res.status(401).json({ error: "GitHub token not configured" });
    return;
  }

  try {
    const contents = (await githubFetch(
      `/repos/${parsed.data.owner}/${parsed.data.repo}/contents`,
      token
    )) as Array<{
      name: string;
      path: string;
      type: string;
      size: number;
      sha: string;
    }>;

    const result = ListRepoContentsResponse.parse(
      contents.map((f) => ({
        name: f.name,
        path: f.path,
        type: f.type === "dir" ? "dir" : "file",
        size: f.type === "dir" ? null : f.size,
        sha: f.sha,
      }))
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list repo contents");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

router.post("/github/file", async (req, res): Promise<void> => {
  const parsed = FetchFileContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const token = getGithubToken();
  if (!token) {
    res.status(401).json({ error: "GitHub token not configured" });
    return;
  }

  try {
    const file = (await githubFetch(
      `/repos/${parsed.data.owner}/${parsed.data.repo}/contents/${parsed.data.path}`,
      token
    )) as {
      path: string;
      content: string;
      sha: string;
      encoding: string;
    };

    // Decode base64 content
    const decodedContent = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8");

    const result = FetchFileContentResponse.parse({
      path: file.path,
      content: decodedContent,
      sha: file.sha,
      encoding: "utf-8",
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch file content");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

router.post("/github/file/update", async (req, res): Promise<void> => {
  const parsed = UpdateFileContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const token = getGithubToken();
  if (!token) {
    res.status(401).json({ error: "GitHub token not configured" });
    return;
  }

  try {
    const encodedContent = Buffer.from(parsed.data.content, "utf-8").toString("base64");

    const response = (await githubFetch(
      `/repos/${parsed.data.owner}/${parsed.data.repo}/contents/${parsed.data.path}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({
          message: parsed.data.message,
          content: encodedContent,
          sha: parsed.data.sha,
        }),
      }
    )) as { content: { path: string; sha: string; encoding: string } };

    const result = UpdateFileContentResponse.parse({
      path: parsed.data.path,
      content: parsed.data.content,
      sha: response.content.sha,
      encoding: "utf-8",
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to update file content");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

router.post("/github/dir", async (req, res): Promise<void> => {
  const parsed = ListDirContentsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const token = getGithubToken();
  if (!token) {
    res.status(401).json({ error: "GitHub token not configured" });
    return;
  }

  try {
    const contents = (await githubFetch(
      `/repos/${parsed.data.owner}/${parsed.data.repo}/contents/${parsed.data.path}`,
      token
    )) as Array<{
      name: string;
      path: string;
      type: string;
      size: number;
      sha: string;
    }>;

    const result = ListDirContentsResponse.parse(
      contents.map((f) => ({
        name: f.name,
        path: f.path,
        type: f.type === "dir" ? "dir" : "file",
        size: f.type === "dir" ? null : f.size,
        sha: f.sha,
      }))
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list directory contents");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

export default router;
