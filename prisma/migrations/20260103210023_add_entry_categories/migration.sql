-- Step 1: Create EntryCategory table
CREATE TABLE "EntryCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "color" TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert default categories
INSERT INTO "EntryCategory" (id, name, color) VALUES
    ('info-id', 'info', 'bg-blue-100 text-blue-800'),
    ('warning-id', 'warning', 'bg-yellow-100 text-yellow-800'),
    ('incident-id', 'incident', 'bg-red-100 text-red-800'),
    ('guest-id', 'guest', 'bg-purple-100 text-purple-800'),
    ('staff-id', 'staff', 'bg-green-100 text-green-800');

-- Step 3: Add categoryId column to Entry (nullable for now)
ALTER TABLE Entry ADD COLUMN categoryId TEXT REFERENCES "EntryCategory"(id);

-- Step 4: Migrate existing entries to new categories
UPDATE Entry SET categoryId = 'info-id' WHERE category = 'info';
UPDATE Entry SET categoryId = 'warning-id' WHERE category = 'warning';
UPDATE Entry SET categoryId = 'incident-id' WHERE category = 'incident';
UPDATE Entry SET categoryId = 'guest-id' WHERE category = 'guest';
UPDATE Entry SET categoryId = 'staff-id' WHERE category = 'staff';

-- Step 5: Make categoryId NOT NULL
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EntryCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Entry" SELECT id, authorId, title, body, categoryId, createdAt, updatedAt FROM Entry;
DROP TABLE Entry;
ALTER TABLE "new_Entry" RENAME TO Entry;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Step 6: Drop old category column (already done in recreate)
-- No need, it's already gone
