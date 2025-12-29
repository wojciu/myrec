import { create } from 'zustand';
import { useAuthStore } from './auth';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    users: number;
  };
}

interface AdminState {
  users: User[];
  departments: Department[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  createUser: (data: {
    email: string;
    password: string;
    displayName: string;
    role: string;
    departmentId?: string;
  }) => Promise<void>;
  updateUser: (id: string, data: {
    email?: string;
    password?: string;
    displayName?: string;
    role?: string;
    departmentId?: string;
  }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createDepartment: (data: { name: string }) => Promise<void>;
  updateDepartment: (id: string, data: { name: string }) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  departments: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
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
      const response = await fetch('/api/admin/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch departments');
      }

      const data = await response.json();
      set({ departments: data.departments, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const newUser = await response.json();
      set((state) => ({ users: [...state.users, newUser], loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateUser: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  createDepartment: async (data) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create department');
      }

      const newDepartment = await response.json();
      set((state) => ({ departments: [...state.departments, newDepartment], loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateDepartment: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update department');
      }

      const updatedDepartment = await response.json();
      set((state) => ({
        departments: state.departments.map((d) => (d.id === id ? updatedDepartment : d)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteDepartment: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete department');
      }

      set((state) => ({
        departments: state.departments.filter((d) => d.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
