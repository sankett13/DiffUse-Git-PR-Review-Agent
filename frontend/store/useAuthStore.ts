import { authService } from "@/services/auth.service";
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: string[] | null;
  accessToken: string | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        isAuthenticated: false,
        isLoading: false,
        isError: null,
        accessToken: null,

        login: async (credentials) => {
          set({ isLoading: true, isError: null });
          try {
            const response = await authService.login(credentials);
            if (response.success) {
              // Sync to cookie for Next.js middleware
              document.cookie = `diffuse_token=${response.accessToken}; path=/; max-age=604800; samesite=lax`;
              
              set({
                accessToken: response.accessToken,
                isAuthenticated: true,
                isLoading: false,
                isError: null,
              });
              return true;
            } else {
              set({
                accessToken: null,
                isAuthenticated: false,
                isLoading: false,
                isError: response.errors || [response.message || "Login failed"],
              });
              throw new Error(response.message || "Login failed");
            }
          } catch (error) {
            set({
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
              isError: ["Something went wrong"],
            });
            throw error; // Re-throw to allow component UI to catch and show the error message
          }
        },

        logout: () => {
          document.cookie = 'diffuse_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          set({
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            isError: null,
          });
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          accessToken: state.accessToken,
        }), // Only persist the authentication status
      },
    ),
  ),
);

export default useAuthStore;
