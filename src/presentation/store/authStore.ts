import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { container } from '@/core/di/container';
import type { Employee } from '@/domain/entities';
import { zustandStorage } from './persist';

interface AuthState {
  employee: Employee | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  login: (code: string, pin: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      employee: null,
      hydrated: false,
      loading: false,
      error: null,
      async login(code, pin) {
        set({ loading: true, error: null });
        try {
          const employee = await container.auth.login.execute(code, pin);
          set({ employee, loading: false });
          return true;
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Login failed' });
          return false;
        }
      },
      logout: () => set({ employee: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: '8star:auth',
      storage: zustandStorage,
      partialize: (s) => ({ employee: s.employee }),
      onRehydrateStorage: () => (state) => {
        state && useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);
