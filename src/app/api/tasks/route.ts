import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createTaskNotification } from '@/lib/notifications';
import { logTaskCreated } from '@/lib/taskActivity';
import { buildTaskVisibilityFilter } from '@/lib/taskVisibility';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Get query params for filtering and sorting
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const assigneeDepartmentId = searchParams.get('assigneeDepartmentId');
    const createdById = searchParams.get('createdById');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const excludeCompleted = searchParams.get('excludeCompleted') === 'true';

    // Build visibility filter using shared helper (single source of truth)
    const additionalFilters: any = {};

    if (status) additionalFilters.status = status;
    if (priority) additionalFilters.priority = parseInt(priority);
    if (assigneeId) additionalFilters.assigneeId = assigneeId;
    if (assigneeDepartmentId) additionalFilters.assigneeDepartmentId = assigneeDepartmentId;
    if (createdById) additionalFilters.createdById = createdById;

    // For admin/manager: exclude done/cancelled tasks when excludeCompleted=true
    if (excludeCompleted && (authUser.role === 'admin' || authUser.role === 'manager')) {
      additionalFilters.status = { notIn: ['done', 'cancelled'] };
    }

    const where = buildTaskVisibilityFilter({
      id: authUser.userId,
      role: authUser.role,
      departmentId: authUser.departmentId,
    }, additionalFilters);

    // Build orderBy based on sortBy and sortOrder params
    const validSortFields = ['priority', 'createdAt', 'dueAt', 'status', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy = { [sortField]: sortDirection };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
          attachments: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Tasks GET error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();

    const {
      title,
      description,
      priority,
      assigneeId,
      assigneeDepartmentId,
      entryId,
      dueAt,
      reminderAt,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Validate priority
    if (priority !== undefined && (priority < 1 || priority > 3)) {
      return NextResponse.json(
        { error: 'priority must be between 1 (high) and 3 (low)' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 2,
        createdById: authUser.userId,
        assigneeId,
        assigneeDepartmentId,
        entryId,
        dueAt: dueAt ? new Date(dueAt) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
      },
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

    // Create notification for assigned users
    if (assigneeId || assigneeDepartmentId) {
      createTaskNotification(task.id, assigneeId, assigneeDepartmentId).catch((err) =>
        console.error('Failed to create task notification:', err)
      );
    }

    // Log activity
    logTaskCreated(task.id, authUser.userId).catch((err) =>
      console.error('Failed to log activity:', err)
    );

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task POST error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
