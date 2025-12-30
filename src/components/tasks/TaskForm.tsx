'use client';

import { useState, useEffect } from 'react';
import { useTasksStore } from '@/store/tasks';
import { useUsersStore } from '@/store/users';
import { useAuthStore } from '@/store/auth';

interface TaskFormProps {
  task: any;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUSES = ['open', 'in_progress', 'done', 'cancelled'] as const;
const PRIORITIES = [1, 2, 3];

export function TaskForm({ task, onClose, onSuccess }: TaskFormProps) {
  const { createTask, updateTask } = useTasksStore();
  const { users, departments, fetchUsers, fetchDepartments } = useUsersStore();
  const { hasHydrated } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('open');
  const [priority, setPriority] = useState<number>(2);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assigneeDepartmentId, setAssigneeDepartmentId] = useState<string>('');
  const [dueAt, setDueAt] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!task;

  useEffect(() => {
    if (hasHydrated) {
      fetchUsers();
      fetchDepartments();
    }
  }, [hasHydrated, fetchUsers, fetchDepartments]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'open');
      setPriority(task.priority || 2);
      setAssigneeId(task.assigneeId || '');
      setAssigneeDepartmentId(task.assigneeDepartmentId || '');
      setDueAt(task.dueAt ? task.dueAt.slice(0, 16) : '');
      setReminderAt(task.reminderAt ? task.reminderAt.slice(0, 16) : '');
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tytuł jest wymagany');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data: any = {
        title: title.trim(),
        priority,
      };

      if (description.trim()) {
        data.description = description.trim();
      }

      if (status) {
        data.status = status;
      }

      if (assigneeId) {
        data.assigneeId = assigneeId;
      }

      if (assigneeDepartmentId) {
        data.assigneeDepartmentId = assigneeDepartmentId;
      }

      if (dueAt) {
        data.dueAt = new Date(dueAt).toISOString();
      }

      if (reminderAt) {
        data.reminderAt = new Date(reminderAt).toISOString();
      }

      if (isEditing) {
        await updateTask(task.id, data);
      } else {
        await createTask(data);
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStatus('open');
    setPriority(2);
    setAssigneeId('');
    setAssigneeDepartmentId('');
    setDueAt('');
    setReminderAt('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edytuj zadanie' : 'Nowe zadanie'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                placeholder="Np. Naprawa kranu w pokoju 205"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Opis
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                placeholder="Szczegóły zadania..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === 'open' && 'Otwarte'}
                      {s === 'in_progress' && 'W trakcie'}
                      {s === 'done' && 'Zakończone'}
                      {s === 'cancelled' && 'Anulowane'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priorytet
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p === 1 && 'Wysoki'}
                      {p === 2 && 'Średni'}
                      {p === 3 && 'Niski'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Przypisz do użytkownika
                </label>
                <select
                  id="assigneeId"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Bez przypisania</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assigneeDepartmentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Przypisz do działu
                </label>
                <select
                  id="assigneeDepartmentId"
                  value={assigneeDepartmentId}
                  onChange={(e) => setAssigneeDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Bez przypisania</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Termin
                </label>
                <input
                  id="dueAt"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="reminderAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Przypomnienie
                </label>
                <input
                  id="reminderAt"
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:text-gray-400"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Zapisywanie...' : isEditing ? 'Zapisz zmiany' : 'Dodaj zadanie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
