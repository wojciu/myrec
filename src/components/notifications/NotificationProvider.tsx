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

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();

    // Set up polling
    const interval = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  return (
    <>
      {children}
      <ReminderModal onOpen={() => setModalOpen(true)} />
    </>
  );
}
