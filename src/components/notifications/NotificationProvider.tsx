'use client';

import { useEffect } from 'react';
import { useNotificationsStore } from '@/store/notifications';
import { useAuthStore } from '@/store/auth';

const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { fetchNotifications } = useNotificationsStore();

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

  return <>{children}</>;
}
