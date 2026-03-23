"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/store/useAuthStore";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  language: string | null;
  description: string | null;
  updated_at: string | null;
}

export function ConnectGithub() {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
  const installUrl = `https://github.com/apps/${slug}/installations/new`;
  const { accessToken } = useAuthStore();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    fetch("http://localhost:4000/api/github/repos", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setConnected(data.connected);
        setRepos(data.repos ?? []);
      })
      .catch(() => setError("Failed to load repositories."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        Loading repositories...
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (!connected) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-gray-600 text-sm">
          Connect your GitHub account to start reviewing pull requests.
        </p>
        <a
          href={installUrl}
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition w-fit"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Connect GitHub Repositories
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Repositories</h2>
        <a
          href={installUrl}
          className="text-sm text-gray-500 hover:text-black transition underline underline-offset-2"
        >
          Manage on GitHub
        </a>
      </div>

      {repos.length === 0 ? (
        <p className="text-gray-500 text-sm">No repositories found for this installation.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {repos.map((repo) => (
            <li
              key={repo.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm hover:underline truncate"
                  >
                    {repo.name}
                  </a>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                      repo.private
                        ? "border-amber-300 text-amber-700 bg-amber-50"
                        : "border-green-300 text-green-700 bg-green-50"
                    }`}
                  >
                    {repo.private ? "Private" : "Public"}
                  </span>
                </div>
                {repo.description && (
                  <p className="text-xs text-gray-500 truncate">{repo.description}</p>
                )}
                {repo.language && (
                  <span className="text-xs text-gray-400">{repo.language}</span>
                )}
              </div>
              <button className="ml-4 shrink-0 text-sm bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition">
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
