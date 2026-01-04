import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createTaskNotification } from '@/lib/notifications';

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

    // Build visibility filter based on user role and assignments
    let where: any;

    if (authUser.role === 'admin') {
      // Admin sees all tasks
      where = {};
    } else if (authUser.role === 'manager' && authUser.departmentId) {
      // Manager sees all tasks from their department:
      // 1. Tasks created by users from their department
      // 2. Tasks assigned to users from their department
      // 3. Tasks assigned to their department
      where = {
        OR: [
          // Created by someone in the department
          {
            createdBy: {
              departmentId: authUser.departmentId,
            },
          },
          // Assigned to someone in the department
          {
            assignee: {
              departmentId: authUser.departmentId,
            },
          },
          // Assigned to the department itself
          {
            assigneeDepartmentId: authUser.departmentId,
          },
        ],
      };
    } else {
      // Regular users see tasks based on visibility rules:
      // 1. Tasks not assigned to anyone (visible to everyone)
      // 2. Tasks assigned to user's department (no specific assignee)
      // 3. Tasks assigned to the user specifically
      // 4. Tasks created by the user
      where = {
        OR: [
          // Rule 1: Unassigned tasks (no person, no department) - visible to everyone
          {
            AND: [
              { assigneeId: null },
              { assigneeDepartmentId: null },
            ],
          },
          // Rule 2: Tasks assigned to user's department (but not to a specific person)
          {
            AND: [
              { assigneeDepartmentId: authUser.departmentId },
              { assigneeId: null },
            ],
          },
          // Rule 3: Tasks assigned specifically to this user
          { assigneeId: authUser.userId },
          // Rule 4: Tasks created by the user
          { createdById: authUser.userId },
        ],
      };
    }

    // Apply additional filters
    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = parseInt(priority);
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (assigneeDepartmentId) {
      where.assigneeDepartmentId = assigneeDepartmentId;
    }

    if (createdById) {
      where.createdById = createdById;
    }

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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task POST error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
