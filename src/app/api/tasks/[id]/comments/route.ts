import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createTaskCommentNotification } from '@/lib/notifications';
import { logCommentAdded } from '@/lib/taskActivity';

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
      select: { id: true, assigneeId: true, assigneeDepartmentId: true, createdById: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access
    const hasAccess =
      authUser.role === 'admin' ||
      (task.assigneeId === null && task.assigneeDepartmentId === null) ||
      (task.assigneeDepartmentId === authUser.departmentId && task.assigneeId === null) ||
      task.assigneeId === authUser.userId ||
      task.createdById === authUser.userId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch comments
    const comments = await prisma.taskComment.findMany({
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Comments GET error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id: taskId } = await params;
    const body = await req.json();

    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, assigneeId: true, assigneeDepartmentId: true, createdById: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access
    const hasAccess =
      authUser.role === 'admin' ||
      (task.assigneeId === null && task.assigneeDepartmentId === null) ||
      (task.assigneeDepartmentId === authUser.departmentId && task.assigneeId === null) ||
      task.assigneeId === authUser.userId ||
      task.createdById === authUser.userId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create comment
    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: authUser.userId,
        content: content.trim(),
      },
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
    });

    // Send notifications about the new comment
    createTaskCommentNotification(
      taskId,
      authUser.userId,
      task.createdById,
      task.assigneeId,
      task.assigneeDepartmentId
    ).catch((err) => console.error('Failed to create comment notification:', err));

    // Log comment activity
    logCommentAdded(taskId, authUser.userId, content.trim()).catch((err) =>
      console.error('Failed to log activity:', err)
    );

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Comment POST error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
