import { prisma } from "./src/app/shared/prisma";

async function main() {
    console.log("Verifying users...");
    const updated = await prisma.user.updateMany({
        where: { email: "testuser_12345@example.com" },
        data: { isVerified: true }
    });
    console.log(`Updated ${updated.count} users.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
