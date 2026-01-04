import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface TaskActivityUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  user: TaskActivityUser;
  type: string;
  details: string | null;
  createdAt: string;
}

interface TaskActivityState {
  activities: TaskActivity[];
  loading: boolean;
  error: string | null;
  fetchActivities: (taskId: string) => Promise<void>;
  clearActivities: () => void;
}

export const useTaskActivityStore = create<TaskActivityState>((set) => ({
  activities: [],
  loading: false,
  error: null,

  fetchActivities: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ activities: TaskActivity[] }>(
        `/api/tasks/${taskId}/activity`
      );
      set({ activities: data.activities, loading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch activity log',
        loading: false,
      });
    }
  },

  clearActivities: () => {
    set({ activities: [], error: null });
  },
}));
