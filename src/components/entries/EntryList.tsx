'use client';

import { useEntriesStore } from '@/store/entries';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';

interface EntryListProps {
  onEdit: (entry: any) => void;
  onView: (entryId: string) => void;
}

const CATEGORIES = ['info', 'warning', 'incident', 'guest', 'staff'] as const;

type FilterType = 'all' | 'unread' | 'info' | 'warning' | 'incident' | 'guest' | 'staff';

export function EntryList({ onEdit, onView }: EntryListProps) {
  const { entries, loading, error, fetchEntries, deleteEntry } = useEntriesStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'unread') {
      return !entry.readBy?.some((r: any) => r.userId === user?.id);
    }
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

  const getInitials = (displayName: string) => {
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (displayName: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500',
    ];
    let hash = 0;
    for (let i = 0; i < displayName.length; i++) {
      hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const isEntryReadByUser = (entry: any) => {
    if (!user) return true;
    return entry.readBy?.some((r: any) => r.userId === user.id);
  };

  const isFromToday = (dateStr: string) => {
    const entryDate = new Date(dateStr);
    const today = new Date();
    return entryDate.toDateString() === today.toDateString();
  };

  const getEntryBorderClass = (entry: any) => {
    if (isEntryReadByUser(entry)) return 'border-gray-200';
    if (isFromToday(entry.createdAt)) return 'border-yellow-300 border-l-4';
    return 'border-red-300 border-l-4';
  };

  const getEntryBgClass = (entry: any) => {
    if (isEntryReadByUser(entry)) return 'bg-white';
    if (isFromToday(entry.createdAt)) return 'bg-yellow-50';
    return 'bg-red-50';
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
        <h2 className="text-xl font-semibold text-gray-900">Dziennik zmian</h2>
        <div className="flex items-center gap-2">
          <button onClick={(e) => setFilter('all')} className="px-3 py-1 text-sm text-gray-600 hover:bg-blue-50 rounded-md disabled:text-gray-400">Wszystkie</button>
          <button onClick={(e) => setFilter('unread')} className="px-3 py-1 text-sm text-gray-600 hover:bg-blue-50 rounded-md disabled:text-gray-400">Nieprzeczytane</button>
          <label className="text-sm text-gray-600">Filtry:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="all">Wszystkie</option>
            <option value="unread">Nieprzeczytane</option>
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
              className={`${getEntryBgClass(entry)} ${getEntryBorderClass(entry)} border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => onView(entry.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}>
                      {entry.category}
                    </span>
                    {entry.title && (
                      <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                    )}
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap mb-2 line-clamp-2">{entry.body}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
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

                  {entry.readBy && entry.readBy.length > 0 && (
                    <div className="flex items-center gap-1 mt-3">
                      <span className="text-xs text-gray-500 mr-1">Przeczytano:</span>
                      <div className="flex -space-x-1">
                        {entry.readBy.slice(0, 5).map((readBy: any) => (
                          <div
                            key={readBy.id}
                            className={`w-7 h-7 rounded-full ${getAvatarColor(readBy.user.displayName)} text-white text-xs flex items-center justify-center font-medium border-1 border-white`}
                            title={`${readBy.user.displayName} - ${formatDate(readBy.readAt)}`}
                          >
                            {getInitials(readBy.user.displayName)}
                          </div>
                        ))}
                        {entry.readBy.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-medium border-2 border-white">
                            +{entry.readBy.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({entry.readBy.length})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(entry);
                    }}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
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
