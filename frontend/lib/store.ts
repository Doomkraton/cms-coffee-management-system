import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth: (token, user) => {
        // Also write to localStorage so the Axios interceptor can read it
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ token, user });
      },

      clearAuth: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ token: null, user: null });
      },

      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: "cms-auth",
      // Only persist token + user; actions are not serializable
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
