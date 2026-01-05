'use client';

import { useState } from 'react';
import { useTasksStore, Attachment } from '@/store/tasks';
import { toast } from 'sonner';

interface AttachmentItemProps {
  attachment: Attachment;
  onDeleted: () => void;
}

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
};

function getFileIcon(contentType: string): string {
  return FILE_ICONS[contentType] || '📎';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function AttachmentItem({ attachment, onDeleted }: AttachmentItemProps) {
  const { deleteAttachment } = useTasksStore();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć ten załącznik?')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAttachment(attachment.id);
      toast.success('Załącznik usunięty');
      onDeleted();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Nie udało się usunąć załącznika');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md group">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
          <span className="text-lg">{getFileIcon(attachment.contentType)}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <a
          href={attachment.filePath}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
        >
          {attachment.fileName}
        </a>
        <p className="text-xs text-gray-500">
          {new Date(attachment.createdAt).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={attachment.filePath}
          download={attachment.fileName}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Pobierz"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          title="Usuń"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
