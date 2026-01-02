import { create } from 'zustand';
import { useAuthStore } from './auth';

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
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/entries', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }

      const data = await response.json();
      set({ entries: data.entries, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchEntry: async (id) => {
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(`/api/entries/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch entry');
    }

    return await response.json();
  },

  createEntry: async (data) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create entry');
      }

      const newEntry = await response.json();
      set((state) => ({ entries: [newEntry, ...state.entries], loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateEntry: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/entries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update entry');
      }

      const updatedEntry = await response.json();
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
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/entries/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete entry');
      }

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
