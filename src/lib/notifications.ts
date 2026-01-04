import { prisma } from './db';

export async function createTaskNotification(taskId: string, assigneeId: string | null, assigneeDepartmentId: string | null) {
  // Find users who should be notified
  const usersToNotify: string[] = [];

  if (assigneeId) {
    usersToNotify.push(assigneeId);
  }

  if (assigneeDepartmentId) {
    // Find all users in this department
    const departmentUsers = await prisma.user.findMany({
      where: { departmentId: assigneeDepartmentId },
      select: { id: true },
    });
    usersToNotify.push(...departmentUsers.map((u) => u.id));
  }

  // Create notifications for each user
  for (const userId of usersToNotify) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'new_task',
        title: 'Przypisano nowe zadanie',
        message: 'Otrzymałeś nowe zadanie do wykonania',
        taskId,
      },
    });
  }
}

export async function createEntryNotification(entryId: string, visibleToDepartmentIds: string[]) {
  // Notify all users in departments that can see this entry
  for (const departmentId of visibleToDepartmentIds) {
    const departmentUsers = await prisma.user.findMany({
      where: { departmentId },
      select: { id: true },
    });

    for (const user of departmentUsers) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'new_entry',
          title: 'Nowy wpis',
          message: 'Dodano nowy wpis w Twoim dziale',
          entryId,
        },
      });
    }
  }
}

export async function createReminderNotification(taskId: string, assigneeId: string | null, assigneeDepartmentId: string | null) {
  // Find users who should be notified
  const usersToNotify: string[] = [];

  if (assigneeId) {
    usersToNotify.push(assigneeId);
  }

  if (assigneeDepartmentId) {
    // Find all users in this department
    const departmentUsers = await prisma.user.findMany({
      where: { departmentId: assigneeDepartmentId },
      select: { id: true },
    });
    usersToNotify.push(...departmentUsers.map((u) => u.id));
  }

  // Create reminder notifications for each user
  for (const userId of usersToNotify) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'task_reminder',
        title: '⏰ Przypomnienie o zadaniu',
        message: 'Pamiętaj o zadaniu które wymaga Twojej uwagi',
        taskId,
      },
    });
  }
}
