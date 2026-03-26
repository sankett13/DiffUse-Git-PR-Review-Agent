"use client";
import React, { useState, useEffect } from "react";
import { githubService } from "@/services/github.service";
import RepoCard from "@/components/RepoCard";
import Link from "next/link";

interface Repo {
  id: string;
  githubRepoId: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  language: string | null;
  status: string;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const data = await githubService.userRepos();
      setRepos(data.repos ?? []);
    } catch (error) {
      console.error("Failed to fetch repos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (repoId: string) => {
    try {
      await githubService.disconnectRepo(repoId);
      setRepos((prev) => prev.filter((repo) => repo.id !== repoId));
    } catch (error) {
      console.error("Failed to disconnect repo:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        Loading repositories...
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Connected Repositories</h1>
      <p className="text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="underline hover:text-black">
          ← Back to available repos
        </Link>
      </p>
      {repos.length === 0 ? (
        <p className="text-gray-500 text-sm">No repositories connected yet.</p>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onDisconnect={() => handleDisconnect(repo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
