import { create } from 'zustand';
import { api } from '@/lib/api-client';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  priority: number;
  assigneeId: string | null;
  assigneeDepartmentId: string | null;
  entryId: string | null;
  dueAt: string | null;
  reminderAt: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
  };
  assignee?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  assigneeDepartment?: {
    id: string;
    name: string;
  } | null;
  entry?: {
    id: string;
    title: string | null;
  } | null;
}

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  fetchTask: (id: string) => Promise<Task>;
  createTask: (data: {
    title: string;
    description?: string;
    status?: string;
    priority?: number;
    assigneeId?: string;
    assigneeDepartmentId?: string;
    entryId?: string;
    dueAt?: string;
    reminderAt?: string;
  }) => Promise<void>;
  updateTask: (id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: number;
    assigneeId?: string;
    assigneeDepartmentId?: string;
    dueAt?: string;
    reminderAt?: string;
  }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ tasks: Task[] }>('/api/tasks');
      set({ tasks: data.tasks, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTask: async (id) => {
    return api.get<Task>(`/api/tasks/${id}`);
  },

  createTask: async (data) => {
    set({ loading: true, error: null });
    try {
      const newTask = await api.post<Task>('/api/tasks', data);
      set((state) => ({ tasks: [newTask, ...state.tasks], loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateTask: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedTask = await api.patch<Task>(`/api/tasks/${id}`, data);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/tasks/${id}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
