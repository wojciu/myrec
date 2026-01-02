import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id: entryId } = await params;

    // Check if entry exists
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Create or update read receipt
    const readReceipt = await prisma.entryReadBy.upsert({
      where: {
        entryId_userId: {
          entryId,
          userId: authUser.userId,
        },
      },
      create: {
        entryId,
        userId: authUser.userId,
      },
      update: {
        readAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json(readReceipt);
  } catch (error) {
    console.error('Mark as read error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
