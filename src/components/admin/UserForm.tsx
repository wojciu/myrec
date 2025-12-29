'use client';

import { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/admin';
import { useAuthStore } from '@/store/auth';

interface UserFormProps {
  user: any;
  departments: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const ROLES = ['admin', 'manager', 'receptionist'] as const;

export function UserForm({ user, departments, onClose, onSuccess }: UserFormProps) {
  const { createUser, updateUser } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<string>('receptionist');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setDisplayName(user.displayName || '');
      setRole(user.role || 'receptionist');
      setDepartmentId(user.departmentId || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) {
      setError('Email i nazwa są wymagane');
      return;
    }

    if (!isEditing && !password.trim()) {
      setError('Hasło jest wymagane przy tworzeniu użytkownika');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data: any = {
        email: email.trim(),
        displayName: displayName.trim(),
        role,
      };

      if (password.trim()) {
        data.password = password.trim();
      }

      if (departmentId) {
        data.departmentId = departmentId;
      }

      if (isEditing) {
        await updateUser(user.id, data);
      } else {
        await createUser(data);
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setRole('receptionist');
    setDepartmentId('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa wyświetlana *
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rola
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Dział
              </label>
              <select
                id="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Brak działu</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło {isEditing && '(puste = bez zmian)'}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isEditing ? 'Zostaw puste, aby nie zmieniać' : 'Wpisz hasło'}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:text-gray-400"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Zapisywanie...' : isEditing ? 'Zapisz' : 'Utwórz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
