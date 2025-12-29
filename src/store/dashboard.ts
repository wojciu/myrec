import { create } from 'zustand';
import { useAuthStore } from './auth';

interface DashboardStats {
  openTasksCount: number;
  inProgressTasksCount: number;
  overdueTasksCount: number;
  todayEntriesCount: number;
  recentEntries: any[];
  urgentTasks: any[];
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;

      // Fetch entries and tasks in parallel
      const [entriesRes, tasksRes] = await Promise.all([
        fetch('/api/entries?limit=10', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/tasks?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!entriesRes.ok || !tasksRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const entriesData = await entriesRes.json();
      const tasksData = await tasksRes.json();

      const tasks = tasksData.tasks || [];
      const entries = entriesData.entries || [];

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const openTasksCount = tasks.filter((t: any) => t.status === 'open').length;
      const inProgressTasksCount = tasks.filter((t: any) => t.status === 'in_progress').length;
      const overdueTasksCount = tasks.filter((t: any) =>
        t.dueAt && new Date(t.dueAt) < now && t.status !== 'done' && t.status !== 'cancelled'
      ).length;
      const todayEntriesCount = entries.filter((e: any) => e.createdAt >= today).length;

      const urgentTasks = tasks
        .filter((t: any) =>
          (t.status === 'open' || t.status === 'in_progress') &&
          (t.priority === 1 || (t.dueAt && new Date(t.dueAt) < new Date(now.getTime() + 24 * 60 * 60 * 1000)))
        )
        .slice(0, 5);

      const recentEntries = entries.slice(0, 5);

      set({
        stats: {
          openTasksCount,
          inProgressTasksCount,
          overdueTasksCount,
          todayEntriesCount,
          recentEntries,
          urgentTasks,
        },
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
