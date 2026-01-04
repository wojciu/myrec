'use client';

import { useNotificationsStore } from '@/store/notifications';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ReminderModalProps {
  onOpen?: () => void;
}

export function ReminderModal({ onOpen }: ReminderModalProps) {
  const { notifications, markAsRead } = useNotificationsStore();
  const [openReminderId, setOpenReminderId] = useState<string | null>(null);
  const router = useRouter();
  const shownReminders = useRef<Set<string>>(new Set());

  // Check for new reminder notifications
  useEffect(() => {
    const unreadReminders = notifications.filter(
      (n) => n.type === 'task_reminder' && !n.read
    );

    // Find first unread reminder that hasn't been shown yet
    const newReminder = unreadReminders.find(n => !shownReminders.current.has(n.id));

    if (newReminder && !openReminderId) {
      setOpenReminderId(newReminder.id);
      shownReminders.current.add(newReminder.id);
      onOpen?.();
    }
  }, [notifications, openReminderId, onOpen]);

  const handleClose = async () => {
    if (openReminderId) {
      await markAsRead(openReminderId);
    }
    setOpenReminderId(null);
  };

  const goToTask = () => {
    if (openReminderId) {
      const reminder = notifications.find(n => n.id === openReminderId);
      if (reminder?.taskId) {
        handleClose();
        router.push(`/tasks?task=${reminder.taskId}`);
      }
    }
  };

  const currentReminder = notifications.find(n => n.id === openReminderId);

  if (!currentReminder) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <span className="text-5xl">⏰</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentReminder.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentReminder.message}
            </p>
            {currentReminder.task && (
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="font-medium text-gray-900">{currentReminder.task.title}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    currentReminder.task.priority === 1
                      ? 'bg-red-100 text-red-800'
                      : currentReminder.task.priority === 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {currentReminder.task.priority === 1 ? 'Wysoki' : currentReminder.task.priority === 2 ? 'Średni' : 'Niski'} priorytet
                  </span>
                  {currentReminder.task.dueAt && (
                    <span>Termin: {new Date(currentReminder.task.dueAt).toLocaleDateString('pl-PL')}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Zamknij
          </button>
          {currentReminder.taskId && (
            <button
              onClick={goToTask}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Przejdź do zadania
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
