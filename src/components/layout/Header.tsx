'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const handleEntries = () => {
    router.push('/entries');
  };

  const handleTasks = () => {
    router.push('/tasks');
  };

  const handleAdmin = () => {
    router.push('/admin');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hotel Shift Journal</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">
              {user?.displayName} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Wyloguj
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <button
            onClick={handleDashboard}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={handleEntries}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Wpisy
          </button>
          <button
            onClick={handleTasks}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Zadania
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={handleAdmin}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Admin
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
