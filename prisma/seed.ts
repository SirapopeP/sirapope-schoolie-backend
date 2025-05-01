import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

console.log('Starting seed script...');

const prisma = new PrismaClient();

async function main() {
  console.log('Main function of seed script started');
  // Constants for root admin
  const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000000'; // Fixed UUID for root admin
  const ROOT_ADMIN_EMAIL = 'goodadmin@schoolie.app';
  const ROOT_ADMIN_USERNAME = 'goodadmin';
  const ROOT_ADMIN_PASSWORD = 'P@ss1234';
  const SALT_ROUNDS = 10;

  try {
    // Delete existing data first
    console.log('Cleaning up existing data...');
    await prisma.userProfile.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Creating root admin account...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(ROOT_ADMIN_PASSWORD, SALT_ROUNDS);
    
    // Create the user first
    const user = await prisma.user.create({
      data: {
        id: ROOT_ADMIN_ID,
        email: ROOT_ADMIN_EMAIL,
        username: ROOT_ADMIN_USERNAME,
        password: hashedPassword,
      }
    });
    
    console.log('Created user:', user);

    // Create profile separately
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        fullName: 'Good Master',
        nickName: 'Goody',
        bio: 'System Administrator',
        avatarUrl: 'https://ui-avatars.com/api/?name=Root+Admin&background=0D8ABC&color=fff',
        phoneNumber: '0800000000',
        address: 'Bangkok, Thailand'
      }
    });

    console.log('Created profile:', profile);

    // Add roles
    await prisma.userRole.createMany({
      data: [
        { userId: user.id, role: 'ADMIN' },
        { userId: user.id, role: 'ACADEMY_OWNER' }
      ]
    });

    console.log('Added roles for user');

    // Verify everything was created correctly
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        roles: true
      }
    });

    console.log('Final user data:', finalUser);
    
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
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