import 'dotenv/config';
import path from 'path';
import cron from 'node-cron';
import { prisma } from '../src/lib/db';

// Set absolute path for DATABASE_URL
if (process.env.DATABASE_URL?.startsWith('file:')) {
  const dbPath = path.join(process.cwd(), process.env.DATABASE_URL.replace('file:', ''));
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// Process reminders - runs every minute
async function processReminders() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for pending reminders...`);

    // Find tasks where reminderAt is due and hasn't been sent
    const dueTasks = await prisma.task.findMany({
      where: {
        reminderAt: {
          lte: new Date(),
        },
        reminderSentAt: null,
        status: {
          not: 'cancelled',
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        assigneeDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (dueTasks.length === 0) {
      return;
    }

    console.log(`[${new Date().toISOString()}] Found ${dueTasks.length} tasks due for reminder`);

    for (const task of dueTasks) {
      try {
        // Send reminder notification
        await sendReminder(task);

        // Mark as sent
        await prisma.task.update({
          where: { id: task.id },
          data: { reminderSentAt: new Date() },
        });

        console.log(`[${new Date().toISOString()}] ✓ Reminder sent for task: ${task.id}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ✗ Failed to send reminder for task ${task.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job error:`, error);
  }
}

// Send reminder notification
async function sendReminder(task: any) {
  const assignee = task.assignee || task.assigneeDepartment;

  if (!assignee) {
    console.log(`[${new Date().toISOString()}] Task "${task.title}" has no assignee - skipping reminder`);
    return;
  }

  // TODO: Implement actual notification (email, push, etc.)
  // For MVP, we just log to console
  console.log(`╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║  📬 REMINDER: Task Due                                     `);
  console.log(`╠═══════════════════════════════════════════════════════════════╣`);
  console.log(`║  Title:       ${task.title.padEnd(50)}║`);
  console.log(`║  Assignee:    ${assignee.name || assignee.displayName || assignee.email}`.padEnd(60) + `║`);
  console.log(`║  Priority:    ${task.priority === 1 ? 'HIGH' : task.priority === 2 ? 'MEDIUM' : 'LOW'}`.padEnd(51) + `║`);
  console.log(`║  Due:         ${task.dueAt ? new Date(task.dueAt).toLocaleString() : 'No due date'}`.padEnd(51) + `║`);
  console.log(`╚═══════════════════════════════════════════════════════════════╝`);
}

// Start cron job
console.log('Starting cron job - checking reminders every minute...');
console.log('Press Ctrl+C to stop');

// Run every minute
cron.schedule('* * * * *', processReminders);

// Run once on startup to check for any missed reminders
setTimeout(() => {
  console.log('Running initial check...');
  processReminders();
}, 1000);
