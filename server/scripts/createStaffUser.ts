import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.STAFF_EMAIL || 'staff@invenio.com';
  const password = process.env.STAFF_PASSWORD || 'staff123';
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.users.upsert({
    where: { email },
    update: {
      name: 'Staff User',
      password: hashed,
      role: 'STAFF',
      isActive: true,
    },
    create: {
      name: 'Staff User',
      email,
      password: hashed,
      role: 'STAFF',
      isActive: true,
    },
  });

  console.log('Staff user created/updated:', { email, password });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
