'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/auth';
import { useTasksStore } from '@/store/tasks';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskDetail } from '@/components/tasks/TaskDetail';

function TasksContent() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { fetchTask } = useTasksStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [initialStatus, setInitialStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Handle ?status= and ?filter= query params to set initial filter
  useEffect(() => {
    const status = searchParams.get('status');
    const filter = searchParams.get('filter');
    if (status) {
      setInitialStatus(status);
    } else if (filter === 'overdue') {
      setInitialStatus('overdue');
    }
  }, [searchParams]);

  // Handle ?id= or ?task= query param to open specific task detail
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const taskId = searchParams.get('id') || searchParams.get('task');
    if (taskId) {
      setViewingTaskId(taskId);
      setShowDetail(true);
      // Clear the URL param
      router.replace('/tasks');
    }
  }, [hasHydrated, isAuthenticated, searchParams, router]);

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

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setViewingTaskId(null);
  };

  const handleDetailEdit = () => {
    // Fetch the task for editing
    if (viewingTaskId) {
      fetchTask(viewingTaskId).then((task) => {
        setEditingTask(task);
        setShowForm(true);
        setShowDetail(false);
        setViewingTaskId(null);
      });
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
      <Header subtitle="Zadania" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleNewTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nowe zadanie
          </button>
        </div>

        <TaskList onEdit={handleEditTask} initialStatus={initialStatus} />

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

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksContent />
    </Suspense>
  );
}
