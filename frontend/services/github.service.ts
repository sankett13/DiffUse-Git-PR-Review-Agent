import apiClient from "./api.client";

export type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  language: string | null;
  description: string | null;
  updated_at: string | null;
};

type GetReposResponse = {
  connected: boolean;
  repos: Repo[];
};

export const githubService = {
  saveInstallation: async (installationId: string) => {
    const response = await apiClient.post("/github/save-installation", {
      installationId,
    });
    return response;
  },

  getRepos: async (): Promise<GetReposResponse> => {
    const response = await apiClient.get("/github/repos");
    return response as unknown as GetReposResponse;
  },

  connectRepo: async (
    id: number,
    name: string,
    full_name: string,
    isPrivate: boolean,
    language: string | null,
    description: string | null,
  ) => {
    const response = await apiClient.post("/github/repos/connect", {
      id,
      name,
      full_name,
      isPrivate,
      language,
      description,
    });
    return response;
  },

  userRepos: async (): Promise<Repo[]> => {
    const response = await apiClient.get("/github/user-repos");
    return response as unknown as Repo[];
  },

  disconnectRepo: async (repoId: string) => {
    const response = await apiClient.delete(`/github/repos/${repoId}`);
    return response;
  },
};
