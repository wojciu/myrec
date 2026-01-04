import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');
    const authorId = searchParams.get('authorId');
    const category = searchParams.get('category');
    const categoryId = searchParams.get('categoryId');

    const where: any = {};

    if (authorId) {
      where.authorId = authorId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (category) {
      // Legacy support - filter by category name
      where.category = {
        name: category,
      };
    }

    // Filter by visible departments based on user role
    if (authUser.role === 'admin') {
      // Admin sees all entries
      // where remains empty
    } else if (authUser.role === 'manager' && authUser.departmentId) {
      // Manager sees all entries from their department:
      // - Entries created by users from their department
      // - Entries visible to their department
      // - Public entries (no department restrictions)
      where.OR = [
        {
          author: {
            departmentId: authUser.departmentId,
          },
        },
        {
          visibleToDepartments: {
            some: {
              id: authUser.departmentId,
            },
          },
        },
        {
          visibleToDepartments: {
            none: {},
          },
        },
      ];
    } else if (authUser.departmentId) {
      // Regular user with department sees:
      // - Entries visible to their department
      // - Public entries (no department restrictions)
      where.OR = [
        {
          visibleToDepartments: {
            some: {
              id: authUser.departmentId,
            },
          },
        },
        {
          visibleToDepartments: {
            none: {},
          },
        },
      ];
    } else {
      // User without department can only see public entries
      where.visibleToDepartments = {
        none: {},
      };
    }

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          visibleToDepartments: {
            select: {
              id: true,
              name: true,
            },
          },
          readBy: {
            select: {
              id: true,
              userId: true,
              readAt: true,
              user: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
            orderBy: {
              readAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.entry.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Entries GET error:', error);
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

    const { title, body: entryBody, categoryId, category, visibleToDepartmentIds } = body;

    if (!entryBody) {
      return NextResponse.json(
        { error: 'body is required' },
        { status: 400 }
      );
    }

    // Support both categoryId (new) and category (legacy)
    let finalCategoryId = categoryId;

    // If legacy category name is provided, find the categoryId
    if (!finalCategoryId && category) {
      const categoryRecord = await prisma.entryCategory.findUnique({
        where: { name: category },
      });
      if (categoryRecord) {
        finalCategoryId = categoryRecord.id;
      } else {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        );
      }
    }

    if (!finalCategoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      );
    }

    const entry = await prisma.entry.create({
      data: {
        authorId: authUser.userId,
        title,
        body: entryBody,
        categoryId: finalCategoryId,
        visibleToDepartments: visibleToDepartmentIds?.length
          ? {
              connect: visibleToDepartmentIds.map((id: string) => ({ id })),
            }
          : undefined,
        // Mark the entry as read by the author immediately
        readBy: {
          create: {
            userId: authUser.userId,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        visibleToDepartments: {
          select: {
            id: true,
            name: true,
          },
        },
        readBy: {
          select: {
            id: true,
            userId: true,
            readAt: true,
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            readAt: 'asc',
          },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Entry POST error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
