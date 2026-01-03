'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useAdminStore } from '@/store/admin';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { UsersList } from '@/components/admin/UsersList';
import { UserForm } from '@/components/admin/UserForm';
import { DepartmentsList } from '@/components/admin/DepartmentsList';
import { DepartmentForm } from '@/components/admin/DepartmentForm';
import { CategoriesList, CategoriesListRef } from '@/components/admin/CategoriesList';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default function AdminPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const { departments, fetchDepartments } = useAdminStore();
  const router = useRouter();
  const [tab, setTab] = useState<'users' | 'departments' | 'categories'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formKey, setFormKey] = useState(0);
  const categoriesListRef = useRef<CategoriesListRef>(null);

  useEffect(() => {
    if (!hasHydrated) return;

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
  }, [isAuthenticated, hasHydrated, user, router, fetchDepartments]);

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

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleCategoryFormSuccess = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    categoriesListRef.current?.refresh();
  };

  if (!hasHydrated) {
    return null;
  }

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
      <Header subtitle="Admin" />

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
            <button
              onClick={() => setTab('categories')}
              className={`px-4 py-2 font-medium ${
                tab === 'categories'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Kategorie wpisów
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
          {tab === 'categories' && (
            <button
              onClick={handleNewCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Nowa kategoria
            </button>
          )}
        </div>

        {tab === 'users' && <UsersList onEdit={handleEditUser} />}
        {tab === 'departments' && <DepartmentsList onEdit={handleEditDept} />}
        {tab === 'categories' && <CategoriesList ref={categoriesListRef} onEdit={handleEditCategory} />}

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

        {showCategoryForm && (
          <CategoryForm
            key={`category-${formKey}`}
            category={editingCategory}
            onClose={() => setShowCategoryForm(false)}
            onSuccess={handleCategoryFormSuccess}
          />
        )}
      </main>
    </div>
  );
}
