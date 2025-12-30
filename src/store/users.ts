import { create } from 'zustand';
import { useAuthStore } from './auth';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  departmentId: string | null;
  department: {
    id: string;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

interface UsersState {
  users: User[];
  departments: Department[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  departments: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      set({ users: data.users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchDepartments: async () => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/departments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      set({ departments: data.departments, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
