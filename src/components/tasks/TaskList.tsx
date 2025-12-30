'use client';

import { useTasksStore } from '@/store/tasks';
import { useEffect, useState } from 'react';

interface TaskListProps {
  onEdit: (task: any) => void;
}

const STATUSES = [
  { value: 'open', label: 'Otwarte' },
  { value: 'in_progress', label: 'W trakcie' },
  { value: 'done', label: 'Zakończone' },
  { value: 'cancelled', label: 'Anulowane' },
] as const;

const PRIORITIES = [
  { value: 1, label: 'Wysoki', color: 'text-red-600 bg-red-50' },
  { value: 2, label: 'Średni', color: 'text-yellow-600 bg-yellow-50' },
  { value: 3, label: 'Niski', color: 'text-green-600 bg-green-50' },
] as const;

export function TaskList({ onEdit }: TaskListProps) {
  const { tasks, loading, error, fetchTasks, deleteTask, updateTask } = useTasksStore();
  const [filter, setFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
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
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      done: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getPriorityInfo = (priority: number) => {
    return PRIORITIES.find((p) => p.value === priority) || PRIORITIES[2];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueAt: string | null) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
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
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Brak zadań
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const priorityInfo = getPriorityInfo(task.priority);
            const overdue = isOverdue(task.dueAt);

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    </div>

                    {task.description && (
                      <p className="text-gray-700 mb-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {task.assignee && (
                        <span>
                          Przypisane: {task.assignee.displayName || task.assignee.email}
                        </span>
                      )}
                      {task.assigneeDepartment && (
                        <span>
                          Dział: {task.assigneeDepartment.name}
                        </span>
                      )}
                      {task.dueAt && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          Termin: {formatDate(task.dueAt)}
                        </span>
                      )}
                      {task.reminderAt && (
                        <span>
                          Przypomnienie: {formatDate(task.reminderAt)}
                        </span>
                      )}
                      <span>
                        Utworzono: {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
                      title="Zmień status"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(task)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        disabled={deleting === task.id}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:text-gray-400"
                      >
                        {deleting === task.id ? 'Usuwanie...' : 'Usuń'}
                      </button>
                    </div>
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
