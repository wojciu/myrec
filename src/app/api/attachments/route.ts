import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Parse FormData manually
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const entryId = formData.get('entryId') as string | null;
    const taskId = formData.get('taskId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!entryId && !taskId) {
      return NextResponse.json(
        { error: 'Either entryId or taskId must be provided' },
        { status: 400 }
      );
    }

    // Verify entry or task exists
    if (entryId) {
      const entry = await prisma.entry.findUnique({ where: { id: entryId } });
      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
    }

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(`.${extension}`, '');
    const fileName = `${timestamp}-${baseName}.${extension}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const attachment = await prisma.attachment.create({
      data: {
        entryId: entryId || undefined,
        taskId: taskId || undefined,
        filePath: `/uploads/${fileName}`,
        fileName: originalName,
        contentType: file.type || 'application/octet-stream',
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Attachment upload error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
