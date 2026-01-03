'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useDashboardStore } from '@/store/dashboard';
import { useEntriesStore } from '@/store/entries';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { UrgentTasks } from '@/components/dashboard/UrgentTasks';
import { EntryDetail } from '@/components/entries/EntryDetail';
import { EntryForm } from '@/components/entries/EntryForm';
import { TaskForm } from '@/components/tasks/TaskForm';
import { usePollingRefresh } from '@/hooks/usePollingRefresh';
import { api } from '@/lib/api-client';

export default function DashboardPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { stats, fetchStats } = useDashboardStore();
  const { fetchEntry } = useEntriesStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchStats();
    }
  }, [isAuthenticated, hasHydrated]);

  // Polling for new entries
  usePollingRefresh({
    fetchData: async () => {
      const data = await api.get<{ entries: any[] }>('/api/entries?limit=10');
      return data;
    },
    extractComparable: (data) => data.entries?.length || 0,
    onNewData: () => {
      fetchStats();
    },
    enabled: hasHydrated && isAuthenticated,
    toastMessage: 'Nowe wpisy pojawiły się na dashboardzie',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleViewEntry = (entryId: string) => {
    setViewingEntryId(entryId);
  };

  const handleDetailClose = () => {
    setViewingEntryId(null);
  };

  const handleEditEntry = async () => {
    const entry = await fetchEntry(viewingEntryId!);
    setViewingEntryId(null);
    router.push(`/entries?id=${entry.id}`);
  };

  const handleEntryFormSuccess = () => {
    fetchStats();
  };

  const handleTaskFormSuccess = () => {
    fetchStats();
  };

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header subtitle="Dashboard" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Przegląd</h2>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50"
          >
            {refreshing ? 'Odświeżanie...' : 'Odśwież'}
          </button>
        </div>

        {/* Main 2-Column Layout: Entries (left) | Tasks (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* LEFT COLUMN - ENTRIES (2/5 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unread Entries Stat Card */}
              <p className="text-lg font-semibold text-black">Wpisy</p>

            <div
              onClick={() => router.push('/entries?filter=unread')}
              className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-5 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Nieprzeczytane wpisy</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-2">{stats?.unreadEntriesCount || 0}</p>
                </div>
                <div className="w-14 h-14 bg-indigo-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📖</span>
                </div>
              </div>
            </div>

            {/* New Entry Button */}
            <button
              onClick={() => setShowEntryForm(true)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <span className="text-lg">+</span> Nowy wpis
            </button>

            {/* Recent Entries */}
            <RecentEntries onViewEntry={handleViewEntry} />
          </div>

          {/* RIGHT COLUMN - TASKS (3/5 width) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Task Stats Cards - 3 in a row */}
            <div className="grid grid-cols-3 gap-3">
              <div
                onClick={() => router.push('/tasks?status=open')}
                className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-lg">📋</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Otwarte</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.openTasksCount || 0}</p>
                </div>
              </div>

              <div
                onClick={() => router.push('/tasks?status=in_progress')}
                className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-lg">⚙️</span>
                  </div>
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">W trakcie</p>
                  <p className="text-2xl font-bold text-amber-900">{stats?.inProgressTasksCount || 0}</p>
                </div>
              </div>

              <div
                onClick={() => router.push('/tasks?filter=overdue')}
                className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-red-300 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Po terminie</p>
                  <p className="text-2xl font-bold text-red-900">{stats?.overdueTasksCount || 0}</p>
                </div>
              </div>
            </div>

            {/* New Task Button */}
            <button
              onClick={() => setShowTaskForm(true)}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <span className="text-lg">+</span> Nowe zadanie
            </button>

            {/* Urgent Tasks */}
            <UrgentTasks />
          </div>
        </div>
      </main>

      {viewingEntryId && (
        <EntryDetail
          entryId={viewingEntryId}
          onClose={handleDetailClose}
          onEdit={handleEditEntry}
        />
      )}

      {/* Entry Form Modal */}
      {showEntryForm && (
        <EntryForm
          entry={null}
          onClose={() => setShowEntryForm(false)}
          onSuccess={handleEntryFormSuccess}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={null}
          onClose={() => setShowTaskForm(false)}
          onSuccess={handleTaskFormSuccess}
        />
      )}
    </div>
  );
}
