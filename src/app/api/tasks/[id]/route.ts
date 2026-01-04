import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createTaskStatusNotification } from '@/lib/notifications';
import {
  logTaskOpened,
  logStatusChanged,
  logTaskUpdated,
  logTaskAssigned,
} from '@/lib/taskActivity';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        assigneeDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        entry: {
          select: {
            id: true,
            title: true,
            body: true,
            category: true,
            authorId: true,
          },
        },
        attachments: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Admin sees all tasks
    if (authUser.role === 'admin') {
      return NextResponse.json(task);
    }

    // Check access - user can see tasks based on visibility rules:
    // 1. Unassigned tasks (no person, no department)
    // 2. Tasks assigned to user's department (but not to a specific person)
    // 3. Tasks assigned specifically to this user
    // 4. Tasks created by the user
    const hasAccess =
      (task.assigneeId === null && task.assigneeDepartmentId === null) ||
      (task.assigneeDepartmentId === authUser.departmentId && task.assigneeId === null) ||
      task.assigneeId === authUser.userId ||
      task.createdById === authUser.userId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Log that task was opened
    logTaskOpened(id, authUser.userId).catch((err) =>
      console.error('Failed to log activity:', err)
    );

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task GET error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Admin can update all tasks
    let hasAccess = authUser.role === 'admin';

    // Non-admin users can update tasks based on visibility rules
    if (!hasAccess) {
      hasAccess =
        (existingTask.assigneeId === null && existingTask.assigneeDepartmentId === null) ||
        (existingTask.assigneeDepartmentId === authUser.departmentId && existingTask.assigneeId === null) ||
        existingTask.assigneeId === authUser.userId ||
        existingTask.createdById === authUser.userId;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      assigneeDepartmentId,
      entryId,
      dueAt,
      reminderAt,
    } = body;

    // Validate status if provided
    const validStatuses = ['open', 'in_progress', 'done', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority !== undefined && (priority < 1 || priority > 3)) {
      return NextResponse.json(
        { error: 'priority must be between 1 (high) and 3 (low)' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (assigneeDepartmentId !== undefined) updateData.assigneeDepartmentId = assigneeDepartmentId;
    if (entryId !== undefined) updateData.entryId = entryId;
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null;
    if (reminderAt !== undefined) updateData.reminderAt = reminderAt ? new Date(reminderAt) : null;

    // Store previous status for notification
    const previousStatus = existingTask.status;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        assigneeDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        entry: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Log status change (always log, even if no notification sent)
    if (status && status !== previousStatus) {
      logStatusChanged(id, authUser.userId, previousStatus, status).catch((err) =>
        console.error('Failed to log activity:', err)
      );
    }

    // Send notification to author if status changed and task has author
    if (status && status !== previousStatus && task.createdById) {
      createTaskStatusNotification(
        task.id,
        previousStatus,
        status,
        authUser.userId,
        task.createdById
      ).catch((err) => console.error('Failed to create status notification:', err));
    }

    // Log assignment change
    const assigneeChanged =
      (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) ||
      (assigneeDepartmentId !== undefined &&
        assigneeDepartmentId !== existingTask.assigneeDepartmentId);

    if (assigneeChanged) {
      const previousAssignee = existingTask.assigneeId
        ? existingTask.assigneeId
        : existingTask.assigneeDepartmentId;
      const newAssignee = assigneeId || assigneeDepartmentId;

      logTaskAssigned(id, authUser.userId, previousAssignee || null, newAssignee || null).catch(
        (err) => console.error('Failed to log activity:', err)
      );
    }

    // Log task update if not status or assignment change
    if (!assigneeChanged && (!status || status === previousStatus)) {
      logTaskUpdated(id, authUser.userId).catch((err) =>
        console.error('Failed to log activity:', err)
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task PATCH error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Admin can delete all tasks
    let hasAccess = authUser.role === 'admin';

    // Non-admin users can delete tasks based on visibility rules
    if (!hasAccess) {
      hasAccess =
        (existingTask.assigneeId === null && existingTask.assigneeDepartmentId === null) ||
        (existingTask.assigneeDepartmentId === authUser.departmentId && existingTask.assigneeId === null) ||
        existingTask.assigneeId === authUser.userId ||
        existingTask.createdById === authUser.userId;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task DELETE error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
