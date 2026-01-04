import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
