import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  color: z.string().min(1, 'Color is required').optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;

    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = await prisma.entryCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Category GET error:', error);
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
    const { id } = await params;
    const body = await req.json();

    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if category exists
    const existing = await prisma.entryCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Validate input
    const validatedData = updateCategorySchema.parse(body);

    // If updating name, check if new name is already taken
    if (validatedData.name && validatedData.name !== existing.name) {
      const nameExists = await prisma.entryCategory.findFirst({
        where: { name: validatedData.name },
      });

      if (nameExists) {
        return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
      }
    }

    // Update category
    const category = await prisma.entryCategory.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Category PATCH error:', error);
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
    const { id } = await params;

    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if category exists
    const existing = await prisma.entryCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Don't allow deletion if category has entries
    if (existing._count.entries > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing entries' },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.entryCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category DELETE error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
