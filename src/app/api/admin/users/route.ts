import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { createUserSchema, updateUserSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Check if user is admin (simple check - in production use proper roles)
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const departmentId = searchParams.get('departmentId');

    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    // Don't send password hashes
    const safeUsers = users.map((u) => ({
      ...u,
    }));

    return NextResponse.json({
      users: safeUsers,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Users GET error:', error);
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

    console.log('POST /api/admin/users body:', JSON.stringify(body, null, 2));

    // Validate input
    const validatedData = createUserSchema.parse(body);

    // Manager must have a department assigned
    if (validatedData.role === 'manager' && !validatedData.departmentId) {
      return NextResponse.json(
        { error: 'Manager musi mieć przypisany dział' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        displayName: validatedData.displayName,
        role: validatedData.role || 'receptionist',
        departmentId: validatedData.departmentId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('User POST error:', error);
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
