'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/auth';
import { useTasksStore } from '@/store/tasks';
import { useRouter, useSearchParams } from 'next/navigation';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';

function TasksContent() {
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const { fetchTask } = useTasksStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Handle ?id= query param to open specific task
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const taskId = searchParams.get('id');
    if (taskId) {
      const loadTask = async () => {
        try {
          const task = await fetchTask(taskId);
          setEditingTask(task);
          setShowForm(true);
          setFormKey((prev) => prev + 1);
          // Clear the URL param
          router.replace('/tasks');
        } catch (error) {
          console.error('Failed to load task:', error);
        }
      };
      loadTask();
    }
  }, [hasHydrated, isAuthenticated, searchParams, fetchTask, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Hotel Shift Journal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {user?.displayName} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleNewTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nowe zadanie
          </button>
        </div>

        <TaskList onEdit={handleEditTask} />

        {showForm && (
          <TaskForm
            key={formKey}
            task={editingTask}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
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
