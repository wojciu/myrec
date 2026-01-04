import { prisma } from './db';

export type ActivityType =
  | 'open_task'
  | 'read_task'
  | 'status_changed'
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'task_created'
  | 'task_updated'
  | 'task_assigned';

interface ActivityDetails {
  fromStatus?: string;
  toStatus?: string;
  commentContent?: string;
  previousAssignee?: string;
  newAssignee?: string;
}

export async function logTaskActivity(
  taskId: string,
  userId: string,
  type: ActivityType,
  details?: ActivityDetails
) {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;

    // Deduplication: check if same activity was logged in last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existing = await prisma.taskActivity.findFirst({
      where: {
        taskId,
        userId,
        type,
        details: detailsJson,
        createdAt: { gte: fiveSecondsAgo },
      },
    });

    if (existing) {
      return; // Skip duplicate
    }

    await prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        type,
        details: detailsJson,
      },
    });
  } catch (error) {
    console.error('Failed to log task activity:', error);
    // Don't throw - activity logging is non-critical
  }
}

export async function logTaskOpened(taskId: string, userId: string) {
  await logTaskActivity(taskId, userId, 'open_task');
}

export async function logStatusChanged(
  taskId: string,
  userId: string,
  fromStatus: string,
  toStatus: string
) {
  await logTaskActivity(taskId, userId, 'status_changed', {
    fromStatus,
    toStatus,
  });
}

export async function logCommentAdded(
  taskId: string,
  userId: string,
  commentContent: string
) {
  await logTaskActivity(taskId, userId, 'comment_added', {
    commentContent,
  });
}

export async function logCommentEdited(
  taskId: string,
  userId: string,
  commentContent: string
) {
  await logTaskActivity(taskId, userId, 'comment_edited', {
    commentContent,
  });
}

export async function logCommentDeleted(taskId: string, userId: string) {
  await logTaskActivity(taskId, userId, 'comment_deleted');
}

export async function logTaskCreated(taskId: string, userId: string) {
  await logTaskActivity(taskId, userId, 'task_created');
}

export async function logTaskUpdated(taskId: string, userId: string) {
  await logTaskActivity(taskId, userId, 'task_updated');
}

export async function logTaskAssigned(
  taskId: string,
  userId: string,
  previousAssignee: string | null,
  newAssignee: string | null
) {
  await logTaskActivity(taskId, userId, 'task_assigned', {
    previousAssignee: previousAssignee || undefined,
    newAssignee: newAssignee || undefined,
  });
}
