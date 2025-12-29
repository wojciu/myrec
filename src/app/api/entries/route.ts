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
    const authorId = searchParams.get('authorId');
    const category = searchParams.get('category');

    const where: any = {};

    if (authorId) {
      where.authorId = authorId;
    }

    if (category) {
      where.category = category;
    }

    // Filter by visible departments - user can see entries visible to their department
    // OR entries with no department restrictions (public entries)
    if (authUser.departmentId) {
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
          visibleToDepartments: {
            select: {
              id: true,
              name: true,
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

    const { title, body: entryBody, category, visibleToDepartmentIds } = body;

    if (!entryBody || !category) {
      return NextResponse.json(
        { error: 'body and category are required' },
        { status: 400 }
      );
    }

    const entry = await prisma.entry.create({
      data: {
        authorId: authUser.userId,
        title,
        body: entryBody,
        category,
        visibleToDepartments: visibleToDepartmentIds?.length
          ? {
              connect: visibleToDepartmentIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        visibleToDepartments: {
          select: {
            id: true,
            name: true,
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
