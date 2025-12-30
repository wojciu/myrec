'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard';
import { useRouter } from 'next/navigation';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-red-600 bg-red-50',
  2: 'text-yellow-600 bg-yellow-50',
  3: 'text-green-600 bg-green-50',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Otwarte',
  in_progress: 'W trakcie',
  done: 'Zakończone',
  cancelled: 'Anulowane',
};

export function UrgentTasks() {
  const { stats, loading, fetchStats } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div className="bg-white rounded-lg p-6">Ładowanie...</div>;
  }

  const tasks = stats?.urgentTasks || [];

  const isOverdue = (dueAt: string | null) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Priorytetowe zadania</h2>
        <button
          onClick={() => router.push('/tasks')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Zobacz wszystkie →
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Brak priorytetowych zadań</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {tasks.map((task: any) => {
            const overdue = isOverdue(task.dueAt);

            return (
              <div
                key={task.id}
                onClick={() => router.push(`/tasks?id=${task.id}`)}
                className={`p-4 hover:bg-gray-50 cursor-pointer group ${overdue ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority === 1 ? 'Wysoki' : task.priority === 2 ? 'Średni' : 'Niski'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {task.dueAt && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          Termin: {new Date(task.dueAt).toLocaleString('pl-PL')}
                        </span>
                      )}
                      {task.assignee && (
                        <span>Przypisane: {task.assignee.displayName || task.assignee.email}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-600 transition-colors">
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
