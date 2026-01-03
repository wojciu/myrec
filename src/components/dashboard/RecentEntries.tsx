'use client';

import { useDashboardStore } from '@/store/dashboard';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const CATEGORY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  incident: 'bg-red-100 text-red-800',
  guest: 'bg-purple-100 text-purple-800',
  staff: 'bg-green-100 text-green-800',
};

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
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Ostatnie wpisy</h2>
        <button
          onClick={() => router.push('/entries')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Zobacz wszystkie →
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Brak wpisów</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry: any) => (
            <div
              key={entry.id}
              onClick={() => handleEntryClick(entry.id)}
              className={`p-4 hover:bg-gray-50 cursor-pointer group border-l ${getEntryBorderClass(entry)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[entry.category] || 'bg-gray-100 text-gray-800'}`}>
                      {entry.category}
                    </span>
                    {entry.title && (
                      <h3 className="font-medium text-gray-900">{entry.title}</h3>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{entry.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-gray-400">
                      {entry.author?.displayName || entry.author?.email} • {new Date(entry.createdAt).toLocaleString('pl-PL')}
                    </p>
                    {entry.readBy && entry.readBy.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Przeczytano:</span>
                        <div className="flex -space-x-1">
                          {entry.readBy.slice(0, 4).map((readBy: any) => (
                            <div
                              key={readBy.id}
                              className={`w-6 h-6 rounded-full ${getAvatarColor(readBy.user.displayName)} text-white text-xs flex items-center justify-center font-medium border-1 border-white`}
                              title={`${readBy.user.displayName} - ${new Date(readBy.readAt).toLocaleString('pl-PL')}`}
                            >
                              {getInitials(readBy.user.displayName)}
                            </div>
                          ))}
                          {entry.readBy.length > 4 && (
                            <div className="w-5 h-5 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-medium border-2 border-white">
                              +{entry.readBy.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">({entry.readBy.length})</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-blue-600 transition-colors">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
