import { PrismaClient } from '@prisma/client';

const { hash } = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test department
  const department = await prisma.department.upsert({
    where: { id: 'test-dept-1' },
    update: {},
    create: {
      id: 'test-dept-1',
      name: 'Reception',
    },
  });
  console.log('✅ Department created:', department.name);

  // Create test user
  const passwordHash = await hash('test123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@hotel.com' },
    update: {},
    create: {
      email: 'test@hotel.com',
      passwordHash,
      displayName: 'Test Receptionist',
      role: 'receptionist',
      departmentId: 'test-dept-1',
    },
  });
  console.log('✅ User created:', user.email);
  console.log('   Password: test123');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
