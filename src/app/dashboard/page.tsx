'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useDashboardStore } from '@/store/dashboard';
import { useEntriesStore } from '@/store/entries';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { UrgentTasks } from '@/components/dashboard/UrgentTasks';
import { EntryDetail } from '@/components/entries/EntryDetail';

export default function DashboardPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { stats, fetchStats } = useDashboardStore();
  const { fetchEntry } = useEntriesStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, hasHydrated, fetchStats]);

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Otwarte zadania"
            value={stats?.openTasksCount || 0}
            color="bg-blue-600"
            icon="📋"
          />
          <StatsCard
            title="W trakcie"
            value={stats?.inProgressTasksCount || 0}
            color="bg-yellow-500"
            icon="⚙️"
          />
          <StatsCard
            title="Po terminie"
            value={stats?.overdueTasksCount || 0}
            subtitle="zadań"
            color="bg-red-600"
            icon="⚠️"
          />
          <StatsCard
            title="Dzisiejsze wpisy"
            value={stats?.todayEntriesCount || 0}
            color="bg-green-600"
            icon="📝"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push('/entries')}
            className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Dziennik zmian</h3>
              <p className="text-sm text-gray-500 mt-1">Zobacz i dodaj wpisy</p>
            </div>
            <span className="text-2xl">📖</span>
          </button>
          <button
            onClick={() => router.push('/tasks')}
            className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Zadania</h3>
              <p className="text-sm text-gray-500 mt-1">Zarządzaj zadaniami</p>
            </div>
            <span className="text-2xl">✅</span>
          </button>
        </div>

        {/* Recent Entries and Urgent Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentEntries onViewEntry={handleViewEntry} />
          <UrgentTasks />
        </div>
      </main>

      {viewingEntryId && (
        <EntryDetail
          entryId={viewingEntryId}
          onClose={handleDetailClose}
          onEdit={handleEditEntry}
        />
      )}
    </div>
  );
}
