import axios from "axios";
import apiClient from "./api.client";

export interface RegisterUser {
  name: string;
  email: string;
  password: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type AuthData = RegisterUser | LoginUser;

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiErrorResponse)?.message ?? fallback;
  }
  return fallback;
};

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  errors?: string[];
  message?: string;
}

export const authService = {
  register: async (data: RegisterUser): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/register", data);
    return response as unknown as AuthResponse;
  },
  login: async (data: LoginUser): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", data);
    return response as unknown as AuthResponse;
  },
};
