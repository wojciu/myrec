'use client';

import { useTasksStore } from '@/store/tasks';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';

interface TaskListProps {
  onEdit: (task: any) => void;
  initialStatus?: string | null;
}

const STATUSES = [
  { value: 'open', label: 'Do zrobienia' },
  { value: 'in_progress', label: 'W trakcie' },
  { value: 'done', label: 'Zrobione' },
  { value: 'cancelled', label: 'Anulowane' },
] as const;

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-red-600 bg-red-50 border-red-200',
  2: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  3: 'text-green-600 bg-green-50 border-green-200',
};

export function TaskList({ onEdit, initialStatus }: TaskListProps) {
  const { tasks, loading, error, fetchTasks, deleteTask, updateTask } = useTasksStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<string>(initialStatus || 'all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Update filter when initialStatus changes
  useEffect(() => {
    if (initialStatus) {
      setFilter(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') {
      // Show tasks that are overdue (dueAt is in the past and not done)
      if (task.status === 'done' || task.status === 'cancelled') return false;
      if (!task.dueAt) return false;
      return new Date(task.dueAt) < new Date();
    }
    return task.status === filter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) return;
    setDeleting(id);
    try {
      await deleteTask(id);
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdating(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
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

  const handleReopen = (taskId: string) => {
    handleStatusChange(taskId, 'open');
  };

  const getStatusLabel = (status: string) => {
    return STATUSES.find((s) => s.value === status)?.label || status;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueAt: string | null) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  const isDoneToday = (updatedAt: string) => {
    const updatedDate = new Date(updatedAt);
    const today = new Date();
    return updatedDate.toDateString() === today.toDateString();
  };

  const canReopen = (task: any) => {
    // Administrator zawsze może otworzyć
    if (user?.role === 'admin') return true;
    // Inni użytkownicy tylko jeśli zadanie było zrobione dzisiaj
    return isDoneToday(task.updatedAt);
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Ładowanie zadań...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Zadania</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filtry:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="all">Wszystkie</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
            <option value="overdue">Po terminie</option>
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Brak zadań
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.dueAt);

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-lg p-3 hover:shadow-md transition-shadow ${
                  overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Priorytet + tytuł */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority === 1 ? '!' : task.priority === 2 ? '!!' : '•'}
                      </span>
                      <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                    </div>

                    {/* Status + metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {getStatusLabel(task.status)}
                      </span>
                      {task.dueAt && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          {overdue && '⚠️ '}
                          {formatDate(task.dueAt)}
                        </span>
                      )}
                      {task.assignee && (
                        <span>👤 {task.assignee.displayName || task.assignee.email}</span>
                      )}
                      {task.assigneeDepartment && (
                        <span>🏢 {task.assigneeDepartment.name}</span>
                      )}
                    </div>

                    {/* Description - opcjonalnie */}
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>

                  {/* Quick actions */}
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
                      </>
                    )}
                    {task.status === 'in_progress' && (
                      <>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReopen(task.id);
                          }}
                          disabled={updating === task.id}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
                          title="Oznacz jako otwarte"
                        >
                          {updating === task.id ? '...' : '↺ Otwórz'}
                        </button>
                      </>
                    )}
                    {task.status === 'done' && canReopen(task) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReopen(task.id);
                        }}
                        disabled={updating === task.id}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
                        title="Oznacz jako otwarte"
                      >
                        {updating === task.id ? '...' : '↺ Otwórz'}
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(task)}
                      className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      title="Edytuj"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={deleting === task.id || updating === task.id}
                      className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400"
                      title="Usuń"
                    >
                      {deleting === task.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
