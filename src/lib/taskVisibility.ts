import { prisma } from './db';

interface User {
  id: string;
  role: string;
  departmentId: string | null;
}

/**
 * Build Prisma where clause for task visibility based on user role
 * This is the single source of truth for task filtering logic
 */
export function buildTaskVisibilityFilter(user: User, additionalFilters?: any) {
  let where: any;

  if (user.role === 'admin') {
    // Admin sees all tasks
    where = {};
  } else if (user.role === 'manager' && user.departmentId) {
    // Manager sees all tasks from their department:
    // 1. Tasks created by users from their department
    // 2. Tasks assigned to users from their department
    // 3. Tasks assigned to their department
    where = {
      OR: [
        {
          createdBy: {
            departmentId: user.departmentId,
          },
        },
        {
          assignee: {
            departmentId: user.departmentId,
          },
        },
        {
          assigneeDepartmentId: user.departmentId,
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
        {
          AND: [
            { assigneeId: null },
            { assigneeDepartmentId: null },
          ],
        },
        {
          AND: [
            { assigneeDepartmentId: user.departmentId },
            { assigneeId: null },
          ],
        },
        { assigneeId: user.id },
        { createdById: user.id },
      ],
    };
  }

  // Apply additional filters (status, priority, etc.)
  if (additionalFilters) {
    Object.keys(additionalFilters).forEach((key) => {
      if (additionalFilters[key] !== undefined && additionalFilters[key] !== null) {
        where[key] = additionalFilters[key];
      }
    });
  }

  return where;
}

/**
 * Get count of tasks visible to user with optional filters
 */
export async function getVisibleTasksCount(user: User, filters?: {
  status?: string;
  priority?: number;
  overdue?: boolean;
}) {
  const where = buildTaskVisibilityFilter(user);

  // Apply status filter
  if (filters?.status) {
    where.status = filters.status;
  }

  // Apply priority filter
  if (filters?.priority !== undefined) {
    where.priority = filters.priority;
  }

  // Apply overdue filter
  if (filters?.overdue) {
    const now = new Date();
    where.dueAt = { lt: now };
    where.status = { notIn: ['done', 'cancelled'] };
  }

  return await prisma.task.count({ where });
}

/**
 * Get tasks visible to user with pagination and filtering
 */
export async function getVisibleTasks(user: User, options: {
  limit?: number;
  offset?: number;
  status?: string;
  priority?: number;
  assigneeId?: string;
  assigneeDepartmentId?: string;
  createdById?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    limit = 30,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    ...filters
  } = options;

  const where = buildTaskVisibilityFilter(user, filters);

  // Build orderBy
  const validSortFields = ['priority', 'createdAt', 'dueAt', 'status', 'updatedAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderBy = { [sortField]: sortOrder };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
            departmentId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
            departmentId: true,
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

  return { tasks, total, limit, offset };
}
