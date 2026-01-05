'use client';

import { useTasksStore, Attachment } from '@/store/tasks';
import { AttachmentItem } from './AttachmentItem';

interface AttachmentListProps {
  attachments: Attachment[];
  onDeleted: () => void;
}

export function AttachmentList({ attachments, onDeleted }: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}
