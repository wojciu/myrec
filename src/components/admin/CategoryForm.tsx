'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryFormProps {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
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

export function CategoryForm({ category, onClose, onSuccess }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('bg-gray-100 text-gray-800');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nazwa kategorii jest wymagana');
      return;
    }

    setLoading(true);
    try {
      if (category) {
        await api.patch(`/api/admin/categories/${category.id}`, { name: name.trim(), color });
      } else {
        await api.post('/api/admin/categories', { name: name.trim(), color });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {category ? 'Edytuj kategorię' : 'Nowa kategoria'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="np. info, warning, incident"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolor *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border-2 transition-all ${
                    color === colorOption.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-gray-300'
                  } ${colorOption.preview}`}
                >
                  {colorOption.label}
                  {color === colorOption.value && ' ✓'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
              Podgląd: {name || 'Nazwa kategorii'}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Zapisywanie...' : category ? 'Zapisz' : 'Utwórz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
