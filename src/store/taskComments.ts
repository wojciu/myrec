import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface TaskCommentUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: TaskCommentUser;
}

interface TaskCommentsState {
  comments: TaskComment[];
  loading: boolean;
  error: string | null;
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<TaskComment>;
  updateComment: (taskId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  clearComments: () => void;
}

export const useTaskCommentsStore = create<TaskCommentsState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,

  fetchComments: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ comments: TaskComment[] }>(`/api/tasks/${taskId}/comments`);
      set({ comments: data.comments, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch comments:', error);
      set({ error: error.message || 'Failed to fetch comments', loading: false });
    }
  },

  addComment: async (taskId: string, content: string) => {
    set({ error: null });
    try {
      const data = await api.post<{ comment: TaskComment }>(`/api/tasks/${taskId}/comments`, { content });
      set((state) => ({
        comments: [...state.comments, data.comment],
      }));
      return data.comment;
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      set({ error: error.message || 'Failed to add comment' });
      throw error;
    }
  },

  updateComment: async (taskId: string, commentId: string, content: string) => {
    set({ error: null });
    try {
      const data = await api.patch<{ comment: TaskComment }>(
        `/api/tasks/${taskId}/comments/${commentId}`,
        { content }
      );
      set((state) => ({
        comments: state.comments.map((c) => (c.id === commentId ? data.comment : c)),
      }));
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      set({ error: error.message || 'Failed to update comment' });
      throw error;
    }
  },

  deleteComment: async (taskId: string, commentId: string) => {
    set({ error: null });
    try {
      await api.delete(`/api/tasks/${taskId}/comments/${commentId}`);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
      }));
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      set({ error: error.message || 'Failed to delete comment' });
      throw error;
    }
  },

  clearComments: () => {
    set({ comments: [], error: null });
  },
}));
