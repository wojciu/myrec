'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboard';
import { useTasksStore } from '@/store/tasks';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-red-700 bg-red-100 border-red-300',
  2: 'text-amber-700 bg-amber-100 border-amber-300',
  3: 'text-green-700 bg-green-100 border-green-300',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Do zrobienia',
  in_progress: 'W trakcie',
  done: 'Zrobione',
  cancelled: 'Anulowane',
};

interface UrgentTasksProps {
  onViewTask?: (taskId: string) => void;
}

export function UrgentTasks({ onViewTask }: UrgentTasksProps) {
  const { stats, loading, fetchStats } = useDashboardStore();
  const { updateTask } = useTasksStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdating(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      await fetchStats();
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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h2 className="text-base font-semibold text-gray-900">Priorytetowe zadania</h2>
        </div>
        <button
          onClick={() => router.push('/tasks')}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          Wszystkie →
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
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
                onClick={() => onViewTask ? onViewTask(task.id) : router.push(`/tasks?id=${task.id}`)}
                className={`p-3 transition-colors cursor-pointer ${overdue ? 'bg-red-50/80' : 'hover:bg-amber-50/30'}`}
              >
                {/* Header with priority, title, and actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Priority badge + title */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold border flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}
                      >
                        {task.priority === 1 ? '🔴' : task.priority === 2 ? '🟡' : '🟢'}
                      </span>
                      <h3 className="font-medium text-gray-900 text-sm">{task.title}</h3>
                    </div>

                    {/* Status, due date, assignee */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded font-medium ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      {task.dueAt && (
                        <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}>
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
                        <span className="text-gray-500">
                          👤 {task.assignee.displayName || task.assignee.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions - MAIN DIFFERENCE vs entries */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {task.status === 'open' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStart(task.id);
                        }}
                        disabled={updating === task.id}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        title="Oznacz jako w trakcie"
                      >
                        {updating === task.id ? '...' : '▶ Start'}
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkDone(task.id);
                        }}
                        disabled={updating === task.id}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                        title="Oznacz jako zrobione"
                      >
                        {updating === task.id ? '...' : '✓ Zrobione'}
                      </button>
                    )}
                    {/* Przycisk edycji tylko dla autora, admina lub managera */}
                    {(!task.createdBy || task.createdBy.id === user?.id || user?.role === 'admin' || user?.role === 'manager') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tasks?edit=${task.id}`);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        title="Edytuj"
                      >
                        Edytuj
                      </button>
                    )}
                  </div>
                </div>

                {/* Description - compact */}
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1.5 ml-1 line-clamp-1">
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
