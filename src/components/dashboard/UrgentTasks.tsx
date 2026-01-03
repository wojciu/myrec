// PROPOZYCJA - nie wprowadzam, tylko do pokazania
// To jest alternatywna wersja UrgentTasks.tsx z quick actions

'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/dashboard';
import { useTasksStore } from '@/store/tasks';
import { useRouter } from 'next/navigation';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-red-600 bg-red-50 border-red-200',
  2: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  3: 'text-green-600 bg-green-50 border-green-200',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Do zrobienia',
  in_progress: 'W trakcie',
  done: 'Zrobione',
  cancelled: 'Anulowane',
};

export function UrgentTasks() {
  const { stats, loading, fetchStats } = useDashboardStore();
  const { updateTask } = useTasksStore();
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdating(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      await fetchStats(); // odśwież stats żeby zniknęło z listy
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkDone = (taskId: string) => {
    handleStatusChange(taskId, 'done');
  };

  const handleStart = (taskId: string) => {
    handleStatusChange(taskId, 'in_progress');
  };

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
          Wszystkie →
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <div className="text-3xl mb-2">🎉</div>
          Brak pilnych zadań
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {tasks.map((task: any) => {
            const overdue = isOverdue(task.dueAt);

            return (
              <div
                key={task.id}
                className={`p-4 ${overdue ? 'bg-red-50' : ''}`}
              >
                {/* Nagłówek z priorytetem i akcjami */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    {/* Priorytet + tytuł w jednej linii */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority === 1 ? '!' : task.priority === 2 ? '!!' : '•'}
                      </span>
                      <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                    </div>

                    {/* Status + termin */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {STATUS_LABELS[task.status]}
                      </span>
                      {task.dueAt && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          {overdue && '⚠️ '}
                          {new Date(task.dueAt).toLocaleDateString('pl-PL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                      {task.assignee && (
                        <span>👤 {task.assignee.displayName || task.assignee.email}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions - głównej różnica vs wpisy */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {task.status === 'open' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStart(task.id);
                          }}
                          disabled={updating === task.id}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                          title="Oznacz jako w trakcie"
                        >
                          {updating === task.id ? '...' : '▶ Start'}
                        </button>
                        
                      </>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkDone(task.id);
                        }}
                        disabled={updating === task.id}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        title="Oznacz jako zrobione"
                      >
                        {updating === task.id ? '...' : '✓ Zrobione'}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/tasks?id=${task.id}`)}
                      className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      title="Szczegóły"
                    >
                      …
                    </button>
                  </div>
                </div>

                {/* Description - opcjonalnie */}
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-1 ml-1">
                    {task.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* GŁÓWNE RÓŻNICE VS WPISY:

1. QUICK ACTIONS - widoczne od razu przyciski akcji:
   - "Start" / "Zrobione" bez wchodzenia w szczegóły
   - Wpisy nie mają quick actions (bo służą czytaniu)

2. PRIORYTET WIZUALNY:
   - Priorytet jako badge z ikoną (! / !! / •)
   - Overdue = czerwone tło + ⚠️

3. KOMPATKOWIEJSZY LAYOUT:
   - Mniej miejsca na description (line-clamp-1)
   - Więcej na akcje

4. MENTAL MODEL:
   - Wpis: kliknij → czytaj → zamknij
   - Zadanie: zobacz → zrób (quick action) LUB kliknij → szczegóły

*/
