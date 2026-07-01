import { prisma } from "./src/shared/prisma";

async function main() {
    console.log("Verifying users...");
    const updated = await prisma.user.updateMany({
        where: { email: "lasiyo9436@fixscal.com" },
        data: { isVerified: true }
    });
    console.log(`Updated ${updated.count} users.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
