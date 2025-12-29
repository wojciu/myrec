import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createDepartmentSchema, updateDepartmentSchema } from '@/lib/validators';

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

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.department.count(),
    ]);

    return NextResponse.json({
      departments,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Departments GET error:', error);
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
    const validatedData = createDepartmentSchema.parse(body);

    // Check if department with same name exists
    const existing = await prisma.department.findFirst({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json({ error: 'Department with this name already exists' }, { status: 400 });
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name: validatedData.name,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Department POST error:', error);
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
