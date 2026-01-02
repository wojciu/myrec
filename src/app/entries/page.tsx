'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/auth';
import { useEntriesStore } from '@/store/entries';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { EntryList } from '@/components/entries/EntryList';
import { EntryForm } from '@/components/entries/EntryForm';

function EntriesContent() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
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
      <Header />

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
