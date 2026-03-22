import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  login: (credentials: { email: string; password: string }) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        isAuthenticated: false,
        isLoading: false,
        isError: false,

        login: (credentials) => {
          set({ isAuthenticated: true, isLoading: false, isError: false });
        },

        logout: () => {
          set({ isAuthenticated: false, isLoading: false, isError: false });
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ isAuthenticated: state.isAuthenticated }), // Only persist the authentication status
      },
    ),
  ),
);

export default useAuthStore;
