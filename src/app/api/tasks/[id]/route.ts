import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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

    // Check access - user can see tasks assigned to them, their department, tasks from entries they created, or unassigned tasks
    const hasAccess =
      task.assigneeId === authUser.userId ||
      task.assigneeDepartmentId === authUser.departmentId ||
      task.entry?.authorId === authUser.userId ||
      (task.assigneeId === null && task.assigneeDepartmentId === null);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Check access - user can update tasks assigned to them, their department, or unassigned tasks
    const hasAccess =
      existingTask.assigneeId === authUser.userId ||
      existingTask.assigneeDepartmentId === authUser.departmentId ||
      (existingTask.assigneeId === null && existingTask.assigneeDepartmentId === null);

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

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
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

    // Check access - user can delete tasks assigned to them, their department, or unassigned tasks
    const hasAccess =
      existingTask.assigneeId === authUser.userId ||
      existingTask.assigneeDepartmentId === authUser.departmentId ||
      (existingTask.assigneeId === null && existingTask.assigneeDepartmentId === null);

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
