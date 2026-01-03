'use client';

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { api } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  color: string;
  _count: {
    entries: number;
  };
  createdAt: string;
}

interface CategoriesListProps {
  onEdit: (category: Category) => void;
  onCategoriesChange?: () => void;
}

const COLOR_OPTIONS = [
  { value: 'bg-blue-100 text-blue-800', label: 'Niebieski', preview: 'bg-blue-100 text-blue-800' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Żółty', preview: 'bg-yellow-100 text-yellow-800' },
  { value: 'bg-red-100 text-red-800', label: 'Czerwony', preview: 'bg-red-100 text-red-800' },
  { value: 'bg-purple-100 text-purple-800', label: 'Fioletowy', preview: 'bg-purple-100 text-purple-800' },
  { value: 'bg-green-100 text-green-800', label: 'Zielony', preview: 'bg-green-100 text-green-800' },
  { value: 'bg-gray-100 text-gray-800', label: 'Szary', preview: 'bg-gray-100 text-gray-800' },
  { value: 'bg-pink-100 text-pink-800', label: 'Różowy', preview: 'bg-pink-100 text-pink-800' },
  { value: 'bg-indigo-100 text-indigo-800', label: 'Indygo', preview: 'bg-indigo-100 text-indigo-800' },
  { value: 'bg-orange-100 text-orange-800', label: 'Pomarańczowy', preview: 'bg-orange-100 text-orange-800' },
  { value: 'bg-teal-100 text-teal-800', label: 'Turkusowy', preview: 'bg-teal-100 text-teal-800' },
];

export interface CategoriesListRef {
  refresh: () => void;
}

export const CategoriesList = forwardRef<CategoriesListRef, CategoriesListProps>(
  function CategoriesList({ onEdit, onCategoriesChange }, ref) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/categories');
      setCategories(response.categories || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const refreshCategories = () => {
    fetchCategories();
    if (onCategoriesChange) {
      onCategoriesChange();
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshCategories,
  }));

  const handleDelete = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category && category._count.entries > 0) {
      alert('Nie można usunąć kategorii, która ma przypisane wpisy.');
      return;
    }

    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return;

    setDeleting(id);
    try {
      await api.delete(`/api/admin/categories/${id}`);
      refreshCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Ładowanie kategorii...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Kategorie wpisów</h2>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          Brak kategorii
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(category)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                    title="Edytuj"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deleting === category.id || category._count.entries > 0}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md disabled:text-gray-400 disabled:hover:bg-transparent"
                    title={category._count.entries > 0 ? 'Kategoria ma wpisy' : 'Usuń'}
                  >
                    {deleting === category.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Wpisów: {category._count.entries}</span>
                <span>{new Date(category.createdAt).toLocaleDateString('pl-PL')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Dostępne kolory:</h3>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <span
              key={color.value}
              className={`px-2 py-1 rounded text-xs font-medium ${color.preview}`}
            >
              {color.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
  }
);
