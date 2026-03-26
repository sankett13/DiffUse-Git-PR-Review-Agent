import apiClient from "./api.client";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  githubId: string | null;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string;
}

type GetMeResponse = {
  success: boolean;
  data: User;
};

type UpdateMeResponse = {
  success: boolean;
  message: string;
  data: User;
};

export const userService = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>("/user/me");
    return (response as unknown as GetMeResponse).data;
  },

  updateMe: async (data: UpdateUserData): Promise<User> => {
    const response = await apiClient.patch<UpdateMeResponse>("/user/me", data);
    return response.data;
  },
};
