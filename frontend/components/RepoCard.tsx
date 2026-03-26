import React from "react";

type RepoCardProps = {
  repo: {
    id: string;
    name: string;
    fullName: string;
    private: boolean;
    description: string | null;
    language: string | null;
    status: string;
  };
  onDisconnect: () => void;
};

export default function RepoCard({ repo, onDisconnect }: RepoCardProps) {
  return (
    <div className="flex flex-row justify-between items-center bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{repo.name}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
              repo.private
                ? "border-amber-300 text-amber-700 bg-amber-50"
                : "border-green-300 text-green-700 bg-green-50"
            }`}
          >
            {repo.private ? "Private" : "Public"}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              repo.status === "ready"
                ? "bg-green-100 text-green-700"
                : repo.status === "indexing"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {repo.status}
          </span>
        </div>
        {repo.description && (
          <p className="text-xs text-gray-500 truncate">{repo.description}</p>
        )}
        {repo.language && (
          <span className="text-xs text-gray-400">{repo.language}</span>
        )}
      </div>
      <div>
        <button
          className="ml-4 shrink-0 text-sm border border-red-300 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition cursor-pointer"
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
