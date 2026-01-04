import { create } from 'zustand';
import { api } from '@/lib/api-client';

interface Entry {
  id: string;
  authorId: string;
  title: string | null;
  body: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
  };
  visibleToDepartments?: Array<{
    id: string;
    name: string;
  }>;
  readBy?: Array<{
    id: string;
    userId: string;
    readAt: string;
    user: {
      id: string;
      displayName: string;
    };
  }>;
}

interface EntriesState {
  entries: Entry[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchEntries: (params?: {
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  fetchEntry: (id: string) => Promise<Entry>;
  createEntry: (data: {
    title?: string;
    body: string;
    categoryId: string;
    visibleToDepartmentIds?: string[];
  }) => Promise<void>;
  updateEntry: (id: string, data: {
    title?: string;
    body?: string;
    categoryId?: string;
    visibleToDepartmentIds?: string[];
  }) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  total: 0,
  loading: false,
  error: null,

  fetchEntries: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const url = queryParams.toString() ? `/api/entries?${queryParams}` : '/api/entries';
      const data = await api.get<{ entries: Entry[]; total: number }>(url);
      set({ entries: data.entries, total: data.total, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchEntry: async (id) => {
    return api.get<Entry>(`/api/entries/${id}`);
  },

  createEntry: async (data) => {
    set({ loading: true, error: null });
    try {
      const newEntry = await api.post<Entry>('/api/entries', data);
      set((state) => ({ entries: [newEntry, ...state.entries], loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateEntry: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedEntry = await api.patch<Entry>(`/api/entries/${id}`, data);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updatedEntry : e)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/entries/${id}`);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
