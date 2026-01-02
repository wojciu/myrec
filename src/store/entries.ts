import { create } from 'zustand';
import { api } from '@/lib/api-client';

interface Entry {
  id: string;
  authorId: string;
  title: string | null;
  body: string;
  category: string;
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
  loading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
  fetchEntry: (id: string) => Promise<Entry>;
  createEntry: (data: {
    title?: string;
    body: string;
    category: string;
    visibleToDepartmentIds?: string[];
  }) => Promise<void>;
  updateEntry: (id: string, data: {
    title?: string;
    body?: string;
    category?: string;
    visibleToDepartmentIds?: string[];
  }) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ entries: Entry[] }>('/api/entries');
      set({ entries: data.entries, loading: false });
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
