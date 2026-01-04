import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { buildTaskVisibilityFilter } from '@/lib/taskVisibility';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Global stats (no visibility filters)
    const [
      openTasksCount,
      inProgressTasksCount,
      overdueTasksCount,
      unreadEntriesCountTotal,
      todayEntriesCount,
    ] = await Promise.all([
      // Open tasks count
      prisma.task.count({
        where: { status: 'open' },
      }),
      // In progress tasks count
      prisma.task.count({
        where: { status: 'in_progress' },
      }),
      // Overdue tasks count
      prisma.task.count({
        where: {
          dueAt: { lt: now },
          status: { notIn: ['done', 'cancelled'] },
        },
      }),
      // Unread entries count (entries with no reads at all)
      prisma.entry.count({
        where: {
          readBy: { none: {} },
        },
      }),
      // Today's entries count
      prisma.entry.count({
        where: {
          createdAt: { gte: today },
        },
      }),
    ]);

    // User-specific stats (using same visibility logic as /api/tasks)
    const userVisibilityFilter = buildTaskVisibilityFilter({
      id: authUser.userId,
      role: authUser.role,
      departmentId: authUser.departmentId,
    });

    const [
      openTasksCountMine,
      inProgressTasksCountMine,
      overdueTasksCountMine,
    ] = await Promise.all([
      // Open tasks for this user
      prisma.task.count({
        where: {
          ...userVisibilityFilter,
          status: 'open',
        },
      }),
      // In progress tasks for this user
      prisma.task.count({
        where: {
          ...userVisibilityFilter,
          status: 'in_progress',
        },
      }),
      // Overdue tasks for this user
      prisma.task.count({
        where: {
          ...userVisibilityFilter,
          dueAt: { lt: now },
          status: { notIn: ['done', 'cancelled'] },
        },
      }),
    ]);

    return NextResponse.json({
      openTasksCount,
      openTasksCountMine,
      inProgressTasksCount,
      inProgressTasksCountMine,
      overdueTasksCount,
      overdueTasksCountMine,
      unreadEntriesCountTotal,
      todayEntriesCount,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
