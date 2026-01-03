'use client';

import { useDashboardStore } from '@/store/dashboard';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-red-500',
];

interface RecentEntriesProps {
  onViewEntry?: (entryId: string) => void;
}

export function RecentEntries({ onViewEntry }: RecentEntriesProps) {
  const { stats, loading } = useDashboardStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const handleEntryClick = (entryId: string) => {
    if (onViewEntry) {
      onViewEntry(entryId);
    } else {
      router.push(`/entries?id=${entryId}`);
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
    let hash = 0;
    for (let i = 0; i < displayName.length; i++) {
      hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
    if (isEntryReadByUser(entry)) return 'border-transparent';
    if (isFromToday(entry.createdAt)) return 'border-l-yellow-400 border-l-4';
    return 'border-l-red-400 border-l-4';
  };

  if (loading) {
    return <div className="bg-white rounded-lg p-6">Ładowanie...</div>;
  }

  const entries = stats?.recentEntries || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <h2 className="text-base font-semibold text-gray-900">Ostatnie wpisy</h2>
        </div>
        <button
          onClick={() => router.push('/entries')}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Wszystkie →
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-3xl mb-2">📝</div>
          Brak wpisów
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry: any) => (
            <div
              key={entry.id}
              onClick={() => handleEntryClick(entry.id)}
              className={`p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors border-l-4 ${getEntryBorderClass(entry)}`}
            >
              {/* Category & Title Row */}
              <div className="flex items-start gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${entry.category?.color || 'bg-gray-100 text-gray-800'}`}>
                  {entry.category?.name || 'Bez kategorii'}
                </span>
                {entry.title && (
                  <h3 className="font-medium text-gray-900 flex-1">{entry.title}</h3>
                )}
              </div>

              {/* Body - more space for reading */}
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{entry.body}</p>

              {/* Footer: author, time, read status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">{entry.author?.displayName || entry.author?.email}</span>
                  <span>•</span>
                  <span>{new Date(entry.createdAt).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Read count with avatars */}
                {entry.readBy && entry.readBy.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {entry.readBy.slice(0, 3).map((readBy: any) => (
                        <div
                          key={readBy.id}
                          className={`w-6 h-6 rounded-full ${getAvatarColor(readBy.user.displayName)} text-white text-xs flex items-center justify-center font-medium border-2 border-white`}
                          title={`${readBy.user.displayName}`}
                        >
                          {getInitials(readBy.user.displayName)}
                        </div>
                      ))}
                      {entry.readBy.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 text-xs flex items-center justify-center font-medium border-2 border-white">
                          +{entry.readBy.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{entry.readBy.length} przeczytano</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
