'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useEntriesStore } from '@/store/entries';
import { api } from '@/lib/api-client';

interface EntryDetailProps {
  entryId: string;
  onClose: () => void;
  onEdit: () => void;
}

export function EntryDetail({ entryId, onClose, onEdit }: EntryDetailProps) {
  const { user } = useAuthStore();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const data = await api.get<any>(`/api/entries/${entryId}`);
        setEntry(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entryId]);

  const handleMarkAsRead = async () => {
    setMarkingAsRead(true);
    try {
      const readReceipt = await api.post<any>(`/api/entries/${entryId}/read`, {});

      // Update entry with new read receipt
      setEntry((prev: any) => ({
        ...prev,
        readBy: [...(prev.readBy || []), readReceipt],
      }));
    } catch (err) {
      console.error('Mark as read error:', err);
    } finally {
      setMarkingAsRead(false);
    }
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasUserRead = entry?.readBy?.some((r: any) => r.userId === user?.id);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
          <div className="text-center py-12">
            <div className="text-gray-500">Ładowanie...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error || 'Wpis nie został znaleziony'}
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {entry.category}
                </span>
                {entry.visibleToDepartments.length > 0 && (
                  <span className="text-xs text-gray-500">
                    Widoczne dla: {entry.visibleToDepartments.map((d: any) => d.name).join(', ')}
                  </span>
                )}
              </div>
              {entry.title && <h2 className="text-xl font-semibold text-gray-900 mb-2">{entry.title}</h2>}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Autor: {entry.author.displayName}</span>
                <span>{formatDate(entry.createdAt)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
            >
              ×
            </button>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{entry.body}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Przeczytano ({entry.readBy?.length || 0})
              </h3>
              {!hasUserRead && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={markingAsRead}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {markingAsRead ? 'Zapisywanie...' : 'Oznacz jako przeczytane'}
                </button>
              )}
            </div>

            {entry.readBy && entry.readBy.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entry.readBy.map((readBy: any) => (
                  <div
                    key={readBy.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded-full ${getAvatarColor(readBy.user.displayName)} text-white text-xs`}
                    title={`${readBy.user.displayName} - ${formatDate(readBy.readAt)}`}
                  >
                    <span className="font-medium">{getInitials(readBy.user.displayName)}</span>
                    <span>{readBy.user.displayName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nikt jeszcze nie przeczytał tego wpisu</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Zamknij
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
