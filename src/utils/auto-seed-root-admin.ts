import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function autoSeedRootAdmin() {
  const prisma = new PrismaClient();
  const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000000';
  const ROOT_ADMIN_EMAIL = 'goodadmin@schoolie.app';
  const ROOT_ADMIN_USERNAME = 'goodadmin';
  const ROOT_ADMIN_PASSWORD = 'P@ss1234';
  const SALT_ROUNDS = 10;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: ROOT_ADMIN_EMAIL },
          { username: ROOT_ADMIN_USERNAME }
        ]
      }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(ROOT_ADMIN_PASSWORD, SALT_ROUNDS);
      const user = await prisma.user.create({
        data: {
          id: ROOT_ADMIN_ID,
          email: ROOT_ADMIN_EMAIL,
          username: ROOT_ADMIN_USERNAME,
          password: hashedPassword,
          profile: {
            create: {
              fullName: 'Root Administrator'
            }
          }
        },
      });

      await prisma.userRole.createMany({
        data: [
          { userId: user.id, role: 'ADMIN' },
          { userId: user.id, role: 'ACADEMY_OWNER' }
        ],
        skipDuplicates: true
      });

      console.log('Auto-seeded root admin user');
    } else {
      // Ensure roles exist
      await prisma.userRole.createMany({
        data: [
          { userId: existingUser.id, role: 'ADMIN' },
          { userId: existingUser.id, role: 'ACADEMY_OWNER' }
        ],
        skipDuplicates: true
      });
      console.log('Root admin already exists, ensured roles');
    }
  } catch (e) {
    console.error('Auto-seed root admin error:', e);
  } finally {
    await prisma.$disconnect();
  }
}