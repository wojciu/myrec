'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/auth';
import { useEntriesStore } from '@/store/entries';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntryList } from '@/components/entries/EntryList';
import { EntryForm } from '@/components/entries/EntryForm';

function EntriesContent() {
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const { fetchEntry } = useEntriesStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Handle ?id= query param to open specific entry
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const entryId = searchParams.get('id');
    if (entryId) {
      const loadEntry = async () => {
        try {
          const entry = await fetchEntry(entryId);
          setEditingEntry(entry);
          setShowForm(true);
          setFormKey((prev) => prev + 1);
          // Clear the URL param
          router.replace('/entries');
        } catch (error) {
          console.error('Failed to load entry:', error);
        }
      };
      loadEntry();
    }
  }, [hasHydrated, isAuthenticated, searchParams, fetchEntry, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setShowForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setShowForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Hotel Shift Journal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {user?.displayName} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleNewEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nowy wpis
          </button>
        </div>

        <EntryList onEdit={handleEditEntry} />

        {showForm && (
          <EntryForm
            key={formKey}
            entry={editingEntry}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </main>
    </div>
  );
}

export default function EntriesPage() {
  return (
    <Suspense fallback={null}>
      <EntriesContent />
    </Suspense>
  );
}
