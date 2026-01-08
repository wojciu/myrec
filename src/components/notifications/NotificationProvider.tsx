'use client';

import { useEffect, useState } from 'react';
import { useNotificationsStore } from '@/store/notifications';
import { useAuthStore } from '@/store/auth';
import { ReminderModal } from './ReminderModal';

const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { fetchNotifications } = useNotificationsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Inicjalizacja bazy danych przy pierwszym załadowaniu
  useEffect(() => {
    const initDatabase = async () => {
      try {
        const response = await fetch('/api/init');
        const data = await response.json();
        if (data.initialized) {
          console.log('✅ Baza danych zainicjowana');
        }
        setDbInitialized(true);
      } catch (error) {
        console.error('Błąd inicjalizacji bazy:', error);
        setDbInitialized(true); // Kontynuuj mimo błędu
      }
    };

    initDatabase();
  }, []);

  useEffect(() => {
    if (!user || !dbInitialized) return;

    // Initial fetch
    fetchNotifications();

    // Set up polling
    const interval = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, fetchNotifications, dbInitialized]);

  return (
    <>
      {children}
      <ReminderModal onOpen={() => setModalOpen(true)} />
    </>
  );
}
