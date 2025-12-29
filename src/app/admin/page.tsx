'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useAdminStore } from '@/store/admin';
import { useRouter } from 'next/navigation';
import { UsersList } from '@/components/admin/UsersList';
import { UserForm } from '@/components/admin/UserForm';
import { DepartmentsList } from '@/components/admin/DepartmentsList';
import { DepartmentForm } from '@/components/admin/DepartmentForm';

export default function AdminPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { departments, fetchDepartments } = useAdminStore();
  const router = useRouter();
  const [tab, setTab] = useState<'users' | 'departments'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has admin/manager role
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    fetchDepartments();
  }, [isAuthenticated, user, router, fetchDepartments]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleUserFormSuccess = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleNewDept = () => {
    setEditingDept(null);
    setShowDeptForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleEditDept = (dept: any) => {
    setEditingDept(dept);
    setShowDeptForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleDeptFormSuccess = () => {
    setShowDeptForm(false);
    setEditingDept(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (user && user.role !== 'admin' && user.role !== 'manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-md">
          Brak uprawnień do tej strony.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hotel Shift Journal</h1>
            <p className="text-sm text-gray-500">Admin</p>
          </div>
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
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button
              onClick={() => setTab('users')}
              className={`px-4 py-2 font-medium ${
                tab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Użytkownicy
            </button>
            <button
              onClick={() => setTab('departments')}
              className={`px-4 py-2 font-medium ${
                tab === 'departments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Działy
            </button>
          </div>
        </div>

        <div className="mb-4">
          {tab === 'users' && (
            <button
              onClick={handleNewUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Nowy użytkownik
            </button>
          )}
          {tab === 'departments' && (
            <button
              onClick={handleNewDept}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Nowy dział
            </button>
          )}
        </div>

        {tab === 'users' && <UsersList onEdit={handleEditUser} />}
        {tab === 'departments' && <DepartmentsList onEdit={handleEditDept} />}

        {showUserForm && (
          <UserForm
            key={`user-${formKey}`}
            user={editingUser}
            departments={departments}
            onClose={() => setShowUserForm(false)}
            onSuccess={handleUserFormSuccess}
          />
        )}

        {showDeptForm && (
          <DepartmentForm
            key={`dept-${formKey}`}
            department={editingDept}
            onClose={() => setShowDeptForm(false)}
            onSuccess={handleDeptFormSuccess}
          />
        )}
      </main>
    </div>
  );
}
