import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'prod.db');

    // Sprawdź czy baza istnieje
    if (!existsSync(dbPath)) {
      // Upewnij się że katalog istnieje
      const dbDir = path.dirname(dbPath);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }

      // Utwórz bazę i tabele
      await prisma.$connect();

      // Utwórz tabele ręcznie (SQL dla SQLite)
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "passwordHash" TEXT NOT NULL,
          "displayName" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'receptionist',
          "departmentId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Department" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "EntryCategory" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "color" TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Entry" (
          "id" TEXT PRIMARY KEY,
          "authorId" TEXT NOT NULL,
          "title" TEXT,
          "body" TEXT NOT NULL,
          "categoryId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("authorId") REFERENCES "User"("id"),
          FOREIGN KEY ("categoryId") REFERENCES "EntryCategory"("id")
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_EntryToDepartment" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          FOREIGN KEY ("A") REFERENCES "Entry"("id") ON DELETE CASCADE,
          FOREIGN KEY ("B") REFERENCES "Department"("id") ON DELETE CASCADE
        )
      `;

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "_EntryToDepartment_AB_unique" ON "_EntryToDepartment"("A", "B")
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "EntryReadBy" (
          "id" TEXT PRIMARY KEY,
          "entryId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
          UNIQUE ("entryId", "userId")
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Task" (
          "id" TEXT PRIMARY KEY,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "status" TEXT NOT NULL DEFAULT 'open',
          "priority" INTEGER NOT NULL DEFAULT 2,
          "createdById" TEXT,
          "assigneeId" TEXT,
          "assigneeDepartmentId" TEXT,
          "entryId" TEXT,
          "dueAt" DATETIME,
          "reminderAt" DATETIME,
          "reminderSentAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL,
          FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL,
          FOREIGN KEY ("assigneeDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL,
          FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE SET NULL
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TaskComment" (
          "id" TEXT PRIMARY KEY,
          "taskId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Attachment" (
          "id" TEXT PRIMARY KEY,
          "entryId" TEXT,
          "taskId" TEXT,
          "filePath" TEXT NOT NULL,
          "fileName" TEXT NOT NULL,
          "contentType" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE SET NULL,
          FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "taskId" TEXT,
          "entryId" TEXT,
          "read" INTEGER NOT NULL DEFAULT 0,
          "readAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
          FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL,
          FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE SET NULL
        )
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TaskActivity" (
          "id" TEXT PRIMARY KEY,
          "taskId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "details" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `;

      // Dodaj domyślne dane
      await prisma.department.create({
        data: { id: 'dept-reception', name: 'Recepcja' }
      });

      await prisma.entryCategory.createMany({
        data: [
          { id: 'cat-info', name: 'Informacja', color: 'bg-blue-100 text-blue-800' },
          { id: 'cat-warning', name: 'Ostrzeżenie', color: 'bg-yellow-100 text-yellow-800' },
          { id: 'cat-incident', name: 'Incident', color: 'bg-red-100 text-red-800' },
          { id: 'cat-request', name: 'Prośba', color: 'bg-purple-100 text-purple-800' },
        ]
      });

      // Utwórz domyślnego użytkownika
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('password123', 10);

      await prisma.user.create({
        data: {
          id: 'test-user-1',
          email: 'test@hotel.com',
          passwordHash,
          displayName: 'Test User',
          role: 'admin',
          departmentId: 'dept-reception'
        }
      });

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        message: 'Baza danych utworzona',
        initialized: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Baza danych już istnieje',
      initialized: false
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
