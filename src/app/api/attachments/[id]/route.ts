import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;

    // Get attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            createdById: true,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check permissions - admin or creator of the task
    let hasAccess = authUser.role === 'admin';

    if (!hasAccess && attachment.task) {
      hasAccess = attachment.task.createdById === authUser.userId;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete file from disk
    if (attachment.filePath) {
      const filePath = join(process.cwd(), attachment.filePath);
      try {
        await unlink(filePath);
      } catch (err) {
        console.error('Failed to delete file from disk:', err);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attachment DELETE error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
