import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { updateUserSchema } from '@/lib/validators';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);

    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User GET error:', error);
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

    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Manager must have a department assigned
    const newRole = validatedData.role ?? existing.role;
    const newDepartmentId = validatedData.departmentId ?? existing.departmentId;
    if (newRole === 'manager' && !newDepartmentId) {
      return NextResponse.json(
        { error: 'Manager musi mieć przypisany dział' },
        { status: 400 }
      );
    }

    // If updating email, check if it's already taken
    if (validatedData.email && validatedData.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailTaken) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.displayName !== undefined) updateData.displayName = validatedData.displayName;
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.departmentId !== undefined) updateData.departmentId = validatedData.departmentId;

    // Hash password if provided
    if (validatedData.password) {
      updateData.passwordHash = await hashPassword(validatedData.password);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('User PATCH error:', error);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);

    // Check if user is admin
    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - only admin can delete users' }, { status: 403 });
    }

    // Prevent self-deletion
    if (authUser.userId === (await params).id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const { id } = await params;

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User DELETE error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
