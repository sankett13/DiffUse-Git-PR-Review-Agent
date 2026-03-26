import React from "react";

type AvailableRepoCardProps = {
  repo: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    language: string | null;
    description: string | null;
  };
  onSelect: () => void;
  isConnecting: boolean;
};

export default function AvailableRepoCard({
  repo,
  onSelect,
  isConnecting,
}: AvailableRepoCardProps) {
  return (
    <div className="flex flex-row justify-between items-center bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition">
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
      <div>
        <button
          className="ml-4 shrink-0 text-sm bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition cursor-pointer disabled:opacity-50"
          onClick={onSelect}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Select"}
        </button>
      </div>
    </div>
  );
}
