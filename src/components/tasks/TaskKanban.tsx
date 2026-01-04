'use client';

import { useEffect, useState, useRef } from 'react';
import { useTasksStore } from '@/store/tasks';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api-client';

interface User {
  id: string;
  displayName: string;
  email: string;
  departmentId?: string | null;
}

interface TaskKanbanProps {
  onEdit: (task: any) => void;
  onView: (task: any) => void;
}

const COLUMNS = [
  { id: 'open', label: 'Do zrobienia', color: 'slate' },
  { id: 'in_progress', label: 'W trakcie', color: 'amber' },
  { id: 'done', label: 'Zrobione', color: 'emerald' },
] as const;

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  3: 'bg-green-100 text-green-700 border-green-200',
};

const COLUMN_COLORS: Record<string, { bg: string; border: string; header: string; count: string }> = {
  open: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    header: 'bg-slate-100 text-slate-700',
    count: 'bg-slate-200 text-slate-700',
  },
  in_progress: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    header: 'bg-amber-100 text-amber-700',
    count: 'bg-amber-200 text-amber-700',
  },
  done: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    header: 'bg-emerald-100 text-emerald-700',
    count: 'bg-emerald-200 text-emerald-700',
  },
};

export function TaskKanban({ onEdit, onView }: TaskKanbanProps) {
  const { tasks, loading, error, fetchTasks, updateTask } = useTasksStore();
  const { user } = useAuthStore();
  const [sortBy, setSortBy] = useState<string>('priority');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterCreatedBy, setFilterCreatedBy] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch all users for admin/manager filters
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get<{ users: User[] }>('/api/users')
        .then(data => setAllUsers(data.users))
        .catch(err => console.error('Failed to fetch users:', err));
    } else if (user?.role === 'manager' && user.departmentId) {
      api.get<{ users: User[] }>('/api/users')
        .then(data => {
          setAllUsers(data.users.filter(u => u.departmentId === user.departmentId));
        })
        .catch(err => console.error('Failed to fetch users:', err));
    }
  }, [user?.role, user?.departmentId]);

  // Fetch all tasks once
  useEffect(() => {
    fetchTasks({
      sortBy: 'priority',
      sortOrder: 'asc',
      limit: 10000,
      offset: 0,
      assigneeId: filterAssignee || undefined,
      createdById: filterCreatedBy || undefined,
    });
  }, [filterAssignee, filterCreatedBy, fetchTasks]);

  // Sort tasks within each column
  const getSortedTasks = (columnTasks: any[]) => {
    return [...columnTasks].sort((a, b) => {
      // Primary: priority (1 = high, 3 = low)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Secondary: due date (earliest first)
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (a.dueAt && !b.dueAt) return -1;
      if (!a.dueAt && b.dueAt) return 1;
      // Tertiary: createdAt
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Group tasks by column
  const columns = COLUMNS.map(col => ({
    ...col,
    tasks: getSortedTasks(tasks.filter(task => task.status === col.id)),
  }));

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === columnId) return;

    setUpdating(draggedTask.id);
    try {
      await updateTask(draggedTask.id, { status: columnId });
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setUpdating(null);
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now;

    return {
      text: date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
      isOverdue,
    };
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
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm text-gray-600">Filtry:</label>
        <label className="text-sm text-gray-600">Przypisane do:</label>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        >
          <option value="">Wszyscy</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName || u.email}
            </option>
          ))}
        </select>

        <label className="text-sm text-gray-600 ml-4">Utworzone przez:</label>
        <select
          value={filterCreatedBy}
          onChange={(e) => setFilterCreatedBy(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        >
          <option value="">Wszyscy</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName || u.email}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => {
          const colors = COLUMN_COLORS[column.id];
          const isDragOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-80 ${colors.bg} ${colors.border} border rounded-lg flex flex-col max-h-[calc(100vh-200px)]`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`p-3 border-b ${colors.border}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${colors.header}`}>
                    {column.label}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.count}`}>
                    {column.tasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {column.tasks.map(task => {
                  const dueDate = formatDate(task.dueAt);
                  const isDragging = draggedTask?.id === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onView(task)}
                      className={`bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${
                        isDragging ? 'opacity-50' : ''
                      } ${dueDate?.isOverdue ? 'border-red-300' : 'border-gray-200'}`}
                    >
                      {/* Priority indicator */}
                      <div className={`flex items-center gap-2 mb-2`}>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority === 1 ? '!' : task.priority === 2 ? '!!' : '•'}
                        </span>
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
                          {task.title}
                        </h4>
                      </div>

                      {/* Due date */}
                      {dueDate && (
                        <div className={`text-xs mb-2 ${dueDate.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          📅 {dueDate.text}
                        </div>
                      )}

                      {/* Assignee */}
                      {task.assignee && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <span>👤</span>
                          <span className="truncate">{task.assignee.displayName || task.assignee.email}</span>
                        </div>
                      )}

                      {/* Updating indicator */}
                      {updating === task.id && (
                        <div className="text-xs text-blue-600 mt-2">
                          Aktualizowanie...
                        </div>
                      )}
                    </div>
                  );
                })}

                {column.tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Brak zadań
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
