import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function autoSeedRootAdmin() {
  const prisma = new PrismaClient();
  const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000000';
  const ROOT_ADMIN_EMAIL = 'goodadmin@schoolie.app';
  const ROOT_ADMIN_USERNAME = 'goodadmin';
  const ROOT_ADMIN_PASSWORD = 'P@ss1234';
  const SALT_ROUNDS = 10;
  
  // กำหนดค่าเริ่มต้นสำหรับ starter academy
  const STARTER_ACADEMY_ID = '00000000-0000-0000-0000-000000000001';
  const STARTER_ACADEMY_NAME = 'Schoolie Official Academy';

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: ROOT_ADMIN_EMAIL },
          { username: ROOT_ADMIN_USERNAME }
        ]
      }
    });

    let userId = ROOT_ADMIN_ID;

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
      userId = user.id;
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
      userId = existingUser.id;
    }

    // Check if starter academy exists
    const existingAcademy = await prisma.academy.findFirst({
      where: {
        OR: [
          { id: STARTER_ACADEMY_ID },
          { 
            AND: [
              { ownerId: userId },
              { name: STARTER_ACADEMY_NAME }
            ] 
          }
        ]
      }
    });

    if (!existingAcademy) {
      // Create starter academy using transaction to ensure all related operations succeed
      await prisma.$transaction(async (tx) => {
        // สร้าง academy ใหม่
        const academy = await tx.academy.create({
          data: {
            id: STARTER_ACADEMY_ID,
            name: STARTER_ACADEMY_NAME,
            bio: 'Official academy for Schoolie platform',
            logoUrl: 'https://ui-avatars.com/api/?name=Schoolie+Academy&background=002B5B&color=fff',
            ownerId: userId,
            isActive: true
          }
        });

        // เพิ่ม owner เป็น member ของ academy ด้วย
        await tx.academyMember.create({
          data: {
            userId: userId,
            academyId: academy.id
          }
        });

        console.log('Auto-created starter academy with owner as member');
      });
    } else {
      // Check if academy member entry exists
      const existingMember = await prisma.academyMember.findUnique({
        where: {
          userId_academyId: {
            userId: userId,
            academyId: existingAcademy.id
          }
        }
      });

      if (!existingMember) {
        // Add academy owner as member if not already
        await prisma.academyMember.create({
          data: {
            userId: userId,
            academyId: existingAcademy.id
          }
        });

        // Update student count
        await prisma.academy.update({
          where: { id: existingAcademy.id },
          data: {
            studentCount: {
              increment: 1
            }
          }
        });

        console.log('Added owner as member to existing academy');
      } else {
        console.log('Starter academy and membership already exist');
      }
    }
  } catch (e) {
    console.error('Auto-seed root admin error:', e);
  } finally {
    await prisma.$disconnect();
  }
}