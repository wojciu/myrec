import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const assigneeDepartmentId = searchParams.get('assigneeDepartmentId');

    const where: any = {
      OR: [
        // User can see tasks assigned to them
        { assigneeId: authUser.userId },
        // Or tasks assigned to their department
        { assigneeDepartmentId: authUser.departmentId },
        // Or tasks they created (via entry)
        {
          entry: {
            authorId: authUser.userId,
          },
        },
        // Or unassigned tasks (no assignee and no department)
        {
          AND: [
            { assigneeId: null },
            { assigneeDepartmentId: null },
          ],
        },
      ],
    };

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

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
          attachments: true,
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'asc' },
          { createdAt: 'desc' },
        ],
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
        assigneeId,
        assigneeDepartmentId,
        entryId,
        dueAt: dueAt ? new Date(dueAt) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
      },
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task POST error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
