import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Fetch unread and recent read notifications for the user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: authUser.userId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        entry: {
          select: {
            id: true,
            title: true,
            body: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        taskId: n.taskId,
        entryId: n.entryId,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        task: n.task,
        entry: n.entry,
      })),
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
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

    const { type, title, message, taskId, entryId } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'type, title, and message are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: authUser.userId,
        type,
        title,
        message,
        taskId,
        entryId,
      },
      });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Notification POST error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
