import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string) => void;
    setAccessToken: (accessToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
            setAccessToken: (accessToken) => set({ accessToken }),
            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // unique name for localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                user: state.user, 
                isAuthenticated: state.isAuthenticated 
            }), // Omit accessToken so it stays in-memory
        }
    )
);
