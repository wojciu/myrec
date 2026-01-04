'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { TaskComments } from './TaskComments';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
  onEdit: () => void;
}

const STATUSES = {
  open: 'Do zrobienia',
  in_progress: 'W trakcie',
  done: 'Zrobione',
  cancelled: 'Anulowane',
} as const;

const STATUS_COLORS = {
  open: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

const PRIORITY_LABELS = {
  1: 'Wysoki',
  2: 'Średni',
  3: 'Niski',
} as const;

const PRIORITY_COLORS = {
  1: 'text-red-600 bg-red-50 border-red-200',
  2: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  3: 'text-green-600 bg-green-50 border-green-200',
} as const;

export function TaskDetail({ taskId, onClose, onEdit }: TaskDetailProps) {
  const { user } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await api.get<any>(`/api/tasks/${taskId}`);
        setTask(data);
      } catch (error) {
        console.error('Failed to fetch task:', error);
        toast.error('Nie udało się załadować zadania');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updated = await api.patch<any>(`/api/tasks/${taskId}`, { status: newStatus });
      setTask(updated);
      toast.success('Status został zaktualizowany');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Nie udało się zaktualizować statusu');
    } finally {
      setUpdating(false);
    }
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

  const canReopen = () => {
    // Admin zawsze może otworzyć
    if (user?.role === 'admin') return true;
    // Inni tylko jeśli zadanie było zrobione dzisiaj
    if (!task?.updatedAt) return false;
    const updatedDate = new Date(task.updatedAt);
    const today = new Date();
    return updatedDate.toDateString() === today.toDateString();
  };

  const getStatusButtons = () => {
    if (!task) return null;

    if (task.status === 'open') {
      return (
        <>
          <button
            onClick={() => handleStatusChange('in_progress')}
            disabled={updating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            ▶ Start
          </button>
          <button
            onClick={() => handleStatusChange('done')}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            ✓ Zrobione
          </button>
        </>
      );
    }

    if (task.status === 'in_progress') {
      return (
        <>
          <button
            onClick={() => handleStatusChange('done')}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            ✓ Zrobione
          </button>
          <button
            onClick={() => handleStatusChange('open')}
            disabled={updating}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
          >
            ↺ Otwórz
          </button>
        </>
      );
    }

    if (task.status === 'done' && canReopen()) {
      return (
        <button
          onClick={() => handleStatusChange('open')}
          disabled={updating}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
        >
          ↺ Otwórz
        </button>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <div className="text-center py-12">
            <div className="text-gray-500">Ładowanie...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            Nie znaleziono zadania
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'done' && task.status !== 'cancelled';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
                {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]} priorytet
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]}`}>
                {STATUSES[task.status as keyof typeof STATUSES]}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-4">
          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Opis</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Utworzone przez</h4>
              <p className="text-gray-700">{task.createdBy?.displayName || task.createdBy?.email || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Data utworzenia</h4>
              <p className="text-gray-700">{formatDate(task.createdAt)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Przypisane do</h4>
              <p className="text-gray-700">
                {task.assignee?.displayName || task.assignee?.email || task.assigneeDepartment?.name || '-'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Termin</h4>
              <p className={`text-gray-700 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                {isOverdue && '⚠️ '}
                {formatDate(task.dueAt)}
              </p>
            </div>
            {task.reminderAt && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Przypomnienie</h4>
                <p className="text-gray-700">{formatDate(task.reminderAt)}</p>
              </div>
            )}
          </div>

          {/* Linked entry */}
          {task.entry && (
            <div className="bg-gray-50 rounded-md p-3">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Powiązany wpis</h4>
              <p className="text-gray-900 font-medium">{task.entry.title}</p>
            </div>
          )}
          </div>

          {/* Comments */}
          <TaskComments taskId={taskId} />
        </div>

        {/* Footer - Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusButtons()}
            </div>
            <button
              onClick={onEdit}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Edytuj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
