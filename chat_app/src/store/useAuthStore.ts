import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

interface AuthState {
    user: User | null;
    tokens: Tokens | null;
    isAuthenticated: boolean;
    setAuth: (user: User, tokens: Tokens) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
            logout: () => set({ user: null, tokens: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // unique name for localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);
