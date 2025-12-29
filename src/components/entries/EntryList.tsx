'use client';

import { useEntriesStore } from '@/store/entries';
import { useEffect, useState } from 'react';

interface EntryListProps {
  onEdit: (entry: any) => void;
}

const CATEGORIES = ['info', 'warning', 'incident', 'guest', 'staff'] as const;

export function EntryList({ onEdit }: EntryListProps) {
  const { entries, loading, error, fetchEntries, deleteEntry } = useEntriesStore();
  const [filter, setFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'all') return true;
    return entry.category === filter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) return;
    setDeleting(id);
    try {
      await deleteEntry(id);
    } finally {
      setDeleting(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      incident: 'bg-red-100 text-red-800',
      guest: 'bg-purple-100 text-purple-800',
      staff: 'bg-green-100 text-green-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Ładowanie wpisów...</div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dziennik zmian</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filtry:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Wszystkie</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Brak wpisów
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}>
                      {entry.category}
                    </span>
                    {entry.title && (
                      <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                    )}
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap mb-2">{entry.body}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {entry.author?.displayName || entry.author?.email || 'Nieznany'}
                    </span>
                    <span>{formatDate(entry.createdAt)}</span>
                    {entry.visibleToDepartments && entry.visibleToDepartments.length > 0 && (
                      <span className="text-gray-400">
                        Widoczne dla: {entry.visibleToDepartments.map((d) => d.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(entry)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:text-gray-400"
                  >
                    {deleting === entry.id ? 'Usuwanie...' : 'Usuń'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
