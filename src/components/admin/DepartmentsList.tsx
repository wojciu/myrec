'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/admin';

interface DepartmentsListProps {
  onEdit: (dept: any) => void;
}

export function DepartmentsList({ onEdit }: DepartmentsListProps) {
  const { departments, loading, error, fetchDepartments, deleteDepartment } = useAdminStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDelete = async (id: string) => {
    const dept = departments.find((d) => d.id === id);
    if (dept && (dept._count?.users ?? 0) > 0) {
      alert('Nie można usunąć działu, który ma przypisanych użytkowników.');
      return;
    }
    if (!confirm('Czy na pewno chcesz usunąć ten dział?')) return;
    setDeleting(id);
    try {
      await deleteDepartment(id);
    } finally {
      setDeleting(null);
    }
  };

  if (loading && departments.length === 0) {
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
        <h2 className="text-lg font-semibold">Działy</h2>
      </div>
      {departments.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Brak działów</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownicy</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {dept._count?.users || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => onEdit(dept)}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      disabled={deleting === dept.id || (dept._count?.users || 0) > 0}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                    >
                      {deleting === dept.id ? 'Usuwanie...' : 'Usuń'}
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
