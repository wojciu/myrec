import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface Attachment {
  id: string;
  filePath: string;
  fileName: string;
  contentType: string;
  createdAt: string;
}

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
  attachments?: Attachment[];
  createdBy?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
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
  total: number;
  loading: boolean;
  error: string | null;
  fetchTasks: (params?: {
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
    assigneeId?: string;
    createdById?: string;
  }) => Promise<void>;
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
  uploadAttachment: (taskId: string, file: File) => Promise<Attachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  total: 0,
  loading: false,
  error: null,

  fetchTasks: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.assigneeId) queryParams.append('assigneeId', params.assigneeId);
      if (params.createdById) queryParams.append('createdById', params.createdById);

      const url = queryParams.toString() ? `/api/tasks?${queryParams}` : '/api/tasks';
      const data = await api.get<{ tasks: Task[]; total: number }>(url);
      set({ tasks: data.tasks, total: data.total, loading: false });
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

  uploadAttachment: async (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    return api.postForm<Attachment>('/api/attachments', formData);
  },

  deleteAttachment: async (attachmentId) => {
    await api.delete(`/api/attachments/${attachmentId}`);
  },
}));
