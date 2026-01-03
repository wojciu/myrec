import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required').default('bg-gray-100 text-gray-800'),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  color: z.string().min(1, 'Color is required').optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [categories, total] = await Promise.all([
      prisma.entryCategory.findMany({
        include: {
          _count: {
            select: {
              entries: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.entryCategory.count(),
    ]);

    return NextResponse.json({
      categories,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Categories GET error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = createCategorySchema.parse(body);

    // Check if category with same name exists
    const existing = await prisma.entryCategory.findFirst({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    // Create category
    const category = await prisma.entryCategory.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Category POST error:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation failed', issues: (error as any).issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
