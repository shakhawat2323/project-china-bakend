import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = "testadmin_" + Date.now() + "@example.com";
    const password = "password123";
    const name = "Test Admin";
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: "ADMIN",
                isVerified: true
            }
        });
        
        await tx.admin.create({
            data: {
                userId: user.id,
                email,
                name
            }
        });
        
        return user;
    });
    console.log("SUCCESS", admin);
  } catch (e) {
    console.error("ERROR", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
