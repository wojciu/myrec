import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id: taskId, commentId } = await params;
    const body = await req.json();

    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if comment exists
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { task: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Verify comment belongs to the task
    if (comment.taskId !== taskId) {
      return NextResponse.json({ error: 'Comment does not belong to this task' }, { status: 400 });
    }

    // Check access - user can edit their own comments, admin can edit all
    const hasAccess =
      authUser.role === 'admin' || comment.userId === authUser.userId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update comment
    const updated = await prisma.taskComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error('Comment PATCH error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id: taskId, commentId } = await params;

    // Check if comment exists
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { task: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Verify comment belongs to the task
    if (comment.taskId !== taskId) {
      return NextResponse.json({ error: 'Comment does not belong to this task' }, { status: 400 });
    }

    // Check access - user can delete their own comments, admin can delete all
    const hasAccess =
      authUser.role === 'admin' || comment.userId === authUser.userId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete comment
    await prisma.taskComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comment DELETE error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
