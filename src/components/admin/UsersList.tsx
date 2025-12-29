'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/admin';

interface UsersListProps {
  onEdit: (user: any) => void;
}

const ROLES = ['admin', 'manager', 'receptionist'] as const;

export function UsersList({ onEdit }: UsersListProps) {
  const { users, loading, error, fetchUsers, deleteUser } = useAdminStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    setDeleting(id);
    try {
      await deleteUser(id);
    } finally {
      setDeleting(null);
    }
  };

  if (loading && users.length === 0) {
    return <div className="text-center py-12 text-gray-500">Ładowanie...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Użytkownicy</h2>
      </div>
      {users.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Brak użytkowników</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rola</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dział</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.department?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleting === user.id}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                    >
                      {deleting === user.id ? 'Usuwanie...' : 'Usuń'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
