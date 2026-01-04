'use client';

import { useState, useEffect } from 'react';
import { useTaskActivityStore, TaskActivity } from '@/store/taskActivity';
import { api } from '@/lib/api-client';

type FilterType = 'all' | 'comments' | 'history';

interface TaskActivityLogProps {
  taskId: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  open_task: '👁️',
  read_task: '👁️',
  status_changed: '🔄',
  comment_added: '💬',
  comment_edited: '✏️',
  comment_deleted: '🗑️',
  task_created: '📋',
  task_updated: '✏️',
  task_assigned: '👤',
};

const ACTIVITY_LABELS: Record<string, string> = {
  open_task: 'otworzył zadanie',
  read_task: 'przeczytał zadanie',
  status_changed: 'zmienił status',
  comment_added: 'dodał komentarz',
  comment_edited: 'edytował komentarz',
  comment_deleted: 'usunął komentarz',
  task_created: 'utworzył zadanie',
  task_updated: 'zaktualizował zadanie',
  task_assigned: 'przypisał zadanie',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Do zrobienia',
  in_progress: 'W trakcie',
  done: 'Zrobione',
  cancelled: 'Anulowane',
};

// Comment-related activity types
const COMMENT_TYPES = ['comment_added', 'comment_edited', 'comment_deleted'];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'przed chwilą';
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays === 1) return 'wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;

  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function getActivityLabel(activity: TaskActivity): string {
  const details = activity.details ? JSON.parse(activity.details) : {};

  switch (activity.type) {
    case 'status_changed':
      const fromLabel = STATUS_LABELS[details.fromStatus] || details.fromStatus;
      const toLabel = STATUS_LABELS[details.toStatus] || details.toStatus;
      return `zmienił status z "${fromLabel}" na "${toLabel}"`;

    case 'comment_added':
    case 'comment_edited':
      return ACTIVITY_LABELS[activity.type];

    case 'task_assigned':
      if (details.newAssignee) {
        return `przypisał zadanie do ${details.newAssignee}`;
      }
      return ACTIVITY_LABELS[activity.type];

    default:
      return ACTIVITY_LABELS[activity.type] || activity.type;
  }
}

function ActivityItem({ activity }: { activity: TaskActivity }) {
  const details = activity.details ? JSON.parse(activity.details) : {};
  const icon = ACTIVITY_ICONS[activity.type] || '📌';
  const label = getActivityLabel(activity);

  return (
    <div className="flex gap-3 py-2">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-sm">{icon}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 text-sm">
            {activity.user.displayName}
          </span>
          <span className="text-sm text-gray-600">{label}</span>
        </div>

        <span className="text-xs text-gray-500">
          {formatDate(activity.createdAt)}
        </span>

        {/* Show comment content if applicable */}
        {(activity.type === 'comment_added' ||
          activity.type === 'comment_edited') &&
          details.commentContent && (
          <div className="mt-2 pl-3 border-l-2 border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {details.commentContent}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-md transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
      {count !== undefined && ` (${count})`}
    </button>
  );
}

export function TaskActivityLog({ taskId }: TaskActivityLogProps) {
  const { activities, loading, error, fetchActivities } = useTaskActivityStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshActivities = () => {
    fetchActivities(taskId);
  };

  useEffect(() => {
    fetchActivities(taskId);
  }, [taskId, fetchActivities]);

  // Filter activities based on selected filter
  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'comments') return COMMENT_TYPES.includes(activity.type);
    if (filter === 'history') return !COMMENT_TYPES.includes(activity.type);
    return true;
  });

  // Count comments and history
  const commentCount = activities.filter((a) => COMMENT_TYPES.includes(a.type)).length;
  const historyCount = activities.filter((a) => !COMMENT_TYPES.includes(a.type)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.post<{ comment: any }>(`/api/tasks/${taskId}/comments`, {
        content: newComment.trim(),
      });
      setNewComment('');
      // Wait a bit for activity to be logged, then refresh
      setTimeout(() => {
        refreshActivities();
      }, 300);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Historia i komentarze
        </h3>

        {/* Filter buttons */}
        <div className="flex gap-1">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} count={activities.length}>
            Wszystko
          </FilterButton>
          <FilterButton active={filter === 'comments'} onClick={() => setFilter('comments')} count={commentCount}>
            Komentarze
          </FilterButton>
          <FilterButton active={filter === 'history'} onClick={() => setFilter('history')} count={historyCount}>
            Historia
          </FilterButton>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {loading && activities.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">
          Ładowanie historii...
        </div>
      ) : (
        <>
          <div className="space-y-1 max-h-96 overflow-y-auto mb-4">
            {filteredActivities.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                {filter === 'comments' && 'Brak komentarzy'}
                {filter === 'history' && 'Brak historii zmian'}
                {filter === 'all' && 'Brak historii dla tego zadania'}
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>

          {/* Comment form */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Napisz komentarz..."
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Wysyłanie...' : 'Wyślij'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
