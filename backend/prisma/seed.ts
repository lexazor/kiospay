import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin12345!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@kiospay.local' },
    update: {
      fullName: 'Super Admin',
      username: 'admin',
      whatsapp: '6281234567890',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
    create: {
      fullName: 'Super Admin',
      username: 'admin',
      whatsapp: '6281234567890',
      email: 'admin@kiospay.local',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });