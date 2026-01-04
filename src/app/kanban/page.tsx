'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { TaskKanban } from '@/components/tasks/TaskKanban';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskDetail } from '@/components/tasks/TaskDetail';

export default function KanbanPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  const handleNewTask = () => {
    setEditingTask(null);
    setShowForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleViewTask = (task: any) => {
    setViewingTaskId(task.id);
    setShowDetail(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setViewingTaskId(null);
  };

  const handleDetailEdit = () => {
    if (viewingTaskId) {
      // Fetch task details for editing
      router.push(`/tasks?edit=${viewingTaskId}`);
      setShowDetail(false);
      setViewingTaskId(null);
    }
  };

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header subtitle="Kanban" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleNewTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nowe zadanie
          </button>
        </div>

        <TaskKanban onEdit={handleEditTask} onView={handleViewTask} />

        {showForm && (
          <TaskForm
            key={formKey}
            task={editingTask}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}

        {showDetail && viewingTaskId && (
          <TaskDetail
            taskId={viewingTaskId}
            onClose={handleDetailClose}
            onEdit={handleDetailEdit}
          />
        )}
      </main>
    </div>
  );
}
