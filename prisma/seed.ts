import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Constants for root admin
  const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000000'; // Fixed UUID for root admin
  const ROOT_ADMIN_EMAIL = 'goodadmin@schoolie.app';
  const ROOT_ADMIN_USERNAME = 'goodadmin';
  const ROOT_ADMIN_PASSWORD = 'P@ss1234';
  const SALT_ROUNDS = 10;

  try {
    // Check if root admin already exists by email/username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: ROOT_ADMIN_EMAIL },
          { username: ROOT_ADMIN_USERNAME }
        ]
      }
    });

    // If root admin doesn't exist, create it with the fixed ID
    if (!existingUser) {
      console.log('Creating root admin account...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(ROOT_ADMIN_PASSWORD, SALT_ROUNDS);
      
      // Create the user with fixed UUID
      const user = await prisma.user.create({
        data: {
          id: ROOT_ADMIN_ID,
          email: ROOT_ADMIN_EMAIL,
          username: ROOT_ADMIN_USERNAME,
          name: 'Root Administrator',
          password: hashedPassword,
        },
      });

      // Add ADMIN role to the user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          role: 'ADMIN',
        },
      });
      
      console.log(`Root admin created with fixed ID: ${user.id}`);
    } else {
      console.log('Root admin already exists, skipping creation');
      
      // Ensure the user has admin role
      const hasAdminRole = await prisma.userRole.findFirst({
        where: {
          userId: existingUser.id,
          role: 'ADMIN',
        },
      });
      
      if (!hasAdminRole) {
        await prisma.userRole.create({
          data: {
            userId: existingUser.id,
            role: 'ADMIN',
          },
        });
        console.log('Added ADMIN role to existing root admin');
      }
    }
    
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 