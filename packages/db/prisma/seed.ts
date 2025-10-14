import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Example: Create a test user
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      password: '$2b$10$example.hashed.password.here', // In real use, hash with bcrypt
    },
  });

  console.log('✅ Created test user:', user);

  // Example: Create a test trip with schedules
  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      destination: '도쿄',
      country: '일본',
      startDate: '2025-10-20',
      endDate: '2025-10-25',
      schedules: {
        create: [
          {
            userId: user.id,
            title: '센소지 방문',
            location: '센소지',
            address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032',
            date: '2025-10-20',
            time: '10:00',
            latitude: 35.7148,
            longitude: 139.7967,
          },
          {
            userId: user.id,
            title: '도쿄 타워 관광',
            location: '도쿄 타워',
            address: '4-2-8 Shibakoen, Minato City, Tokyo 105-0011',
            date: '2025-10-20',
            time: '15:00',
            latitude: 35.6586,
            longitude: 139.7454,
          },
        ],
      },
    },
    include: {
      schedules: true,
    },
  });

  console.log('✅ Created test trip with schedules:', trip);

  // Example: Create test expenses
  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      scheduleId: trip.schedules[0].id,
      title: '점심 식사',
      amount: 2500,
      currency: 'JPY',
      category: '식비',
      date: '2025-10-20',
      hasReceipt: true,
    },
  });

  console.log('✅ Created test expense:', expense);

  console.log('🎉 Seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
