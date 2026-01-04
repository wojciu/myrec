'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskCommentsStore, TaskComment } from '@/store/taskComments';
import { CommentItem } from './CommentItem';

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { comments, loading, error, fetchComments, addComment, updateComment, deleteComment } = useTaskCommentsStore();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<TaskComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments(taskId);
  }, [taskId, fetchComments]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await addComment(taskId, newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment: TaskComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || !editContent.trim()) return;

    setSubmitting(true);
    try {
      await updateComment(taskId, editingComment.id, editContent.trim());
      setEditingComment(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;

    setSubmitting(true);
    try {
      await deleteComment(taskId, commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Komentarze ({comments.length})
      </h3>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {loading && comments.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">
          Ładowanie komentarzy...
        </div>
      ) : (
        <>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                Brak komentarzy. Bądź pierwszy!
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {editingComment ? (
            <form onSubmit={handleUpdate} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Edytuj komentarz..."
                  disabled={submitting}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting || !editContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Zapisz
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Anuluj
                </button>
              </div>
            </form>
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}
