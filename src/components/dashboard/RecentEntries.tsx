'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard';
import { useRouter } from 'next/navigation';

const CATEGORY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  incident: 'bg-red-100 text-red-800',
  guest: 'bg-purple-100 text-purple-800',
  staff: 'bg-green-100 text-green-800',
};

export function RecentEntries() {
  const { stats, loading, fetchStats } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div className="bg-white rounded-lg p-6">Ładowanie...</div>;
  }

  const entries = stats?.recentEntries || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Ostatnie wpisy</h2>
        <button
          onClick={() => router.push('/entries')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Zobacz wszystkie →
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Brak wpisów</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry: any) => (
            <div
              key={entry.id}
              onClick={() => router.push(`/entries?id=${entry.id}`)}
              className="p-4 hover:bg-gray-50 cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[entry.category] || 'bg-gray-100 text-gray-800'}`}>
                      {entry.category}
                    </span>
                    {entry.title && (
                      <h3 className="font-medium text-gray-900">{entry.title}</h3>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{entry.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {entry.author?.displayName || entry.author?.email} • {new Date(entry.createdAt).toLocaleString('pl-PL')}
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-blue-600 transition-colors">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
