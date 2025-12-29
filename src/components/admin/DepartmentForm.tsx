'use client';

import { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/admin';

interface DepartmentFormProps {
  department: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepartmentForm({ department, onClose, onSuccess }: DepartmentFormProps) {
  const { createDepartment, updateDepartment } = useAdminStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!department;

  useEffect(() => {
    if (department) {
      setName(department.name || '');
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nazwa jest wymagana');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = { name: name.trim() };

      if (isEditing) {
        await updateDepartment(department.id, data);
      } else {
        await createDepartment(data);
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
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edytuj dział' : 'Nowy dział'}
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Np. Recepcja, Sprzątanie"
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
