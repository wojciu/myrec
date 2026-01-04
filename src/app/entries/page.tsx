'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/auth';
import { useEntriesStore } from '@/store/entries';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { EntryList } from '@/components/entries/EntryList';
import { EntryForm } from '@/components/entries/EntryForm';
import { EntryDetail } from '@/components/entries/EntryDetail';

function EntriesContent() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { fetchEntry } = useEntriesStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [initialFilter, setInitialFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Handle ?filter= query param to set initial filter
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      setInitialFilter(filter);
    }
  }, [searchParams]);

  // Handle ?id= or ?entry= query param to open specific entry (now opens detail, not edit)
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const entryId = searchParams.get('id') || searchParams.get('entry');
    if (entryId) {
      setViewingEntryId(entryId);
      setShowDetail(true);
      // Clear the URL param
      router.replace('/entries');
    }
  }, [hasHydrated, isAuthenticated, searchParams, router]);

  const handleNewEntry = () => {
    setEditingEntry(null);
    setShowForm(true);
    setFormKey((prev) => prev + 1);
  };

  const handleViewEntry = (entryId: string) => {
    setViewingEntryId(entryId);
    setShowDetail(true);
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

  const handleDetailClose = () => {
    setShowDetail(false);
    setViewingEntryId(null);
  };

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header subtitle="Wpisy dziennika" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleNewEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nowy wpis
          </button>
        </div>

        <EntryList onEdit={handleEditEntry} onView={handleViewEntry} initialFilter={initialFilter} />

        {showForm && (
          <EntryForm
            key={formKey}
            entry={editingEntry}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}

        {showDetail && viewingEntryId && (
          <EntryDetail
            entryId={viewingEntryId}
            onClose={handleDetailClose}
            onEdit={() => {
              handleDetailClose();
              // Fetch the entry for editing
              fetchEntry(viewingEntryId).then(handleEditEntry);
            }}
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
