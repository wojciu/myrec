'use client';

import { TaskComment, TaskCommentUser } from '@/store/taskComments';
import { useAuthStore } from '@/store/auth';

interface CommentItemProps {
  comment: TaskComment;
  onEdit: (comment: TaskComment) => void;
  onDelete: (commentId: string) => void;
}

export function CommentItem({ comment, onEdit, onDelete }: CommentItemProps) {
  const { user } = useAuthStore();

  const canEdit = user?.role === 'admin' || user?.id === comment.userId;
  const isOwnComment = user?.id === comment.userId;

  const formatDate = (dateString: string) => {
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

    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="group relative py-3">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">
              {comment.user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {comment.user.displayName}
            </span>
            {comment.user.role === 'admin' && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                Admin
              </span>
            )}
            {isOwnComment && (
              <span className="text-xs text-gray-500">
                (Ty)
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-400">
                (edytowany)
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {canEdit && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(comment)}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Edytuj komentarz"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Usuń komentarz"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
