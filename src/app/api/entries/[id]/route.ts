import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;

    const entry = await prisma.entry.findUnique({
      where: { id },
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
        tasks: true,
        attachments: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Check if user can see this entry
    if (entry.visibleToDepartments.length > 0) {
      const hasAccess = entry.visibleToDepartments.some(
        (dept) => dept.id === authUser.departmentId
      );
      if (!hasAccess && entry.authorId !== authUser.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Entry GET error:', error);
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

    // Check if entry exists and user is the author
    const existingEntry = await prisma.entry.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (existingEntry.authorId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, body: entryBody, category, visibleToDepartmentIds } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (entryBody !== undefined) updateData.body = entryBody;
    if (category !== undefined) updateData.category = category;

    if (visibleToDepartmentIds !== undefined) {
      updateData.visibleToDepartments = {
        set: [],
        connect: visibleToDepartmentIds.map((id: string) => ({ id })),
      };
    }

    const entry = await prisma.entry.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Entry PATCH error:', error);
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

    // Check if entry exists and user is the author
    const existingEntry = await prisma.entry.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (existingEntry.authorId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.entry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Entry DELETE error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
