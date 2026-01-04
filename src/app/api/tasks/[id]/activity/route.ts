import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id: taskId } = await params;

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        assigneeId: true,
        assigneeDepartmentId: true,
        createdById: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access based on role
    // Admin: all activity
    // Manager: activity for tasks in their department
    // Others: activity for their assigned tasks
    const hasAccess =
      authUser.role === 'admin' ||
      (authUser.role === 'manager' && task.assigneeDepartmentId === authUser.departmentId) ||
      task.assigneeId === authUser.userId ||
      task.createdById === authUser.userId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch activities
    const activities = await prisma.taskActivity.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Activity GET error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
