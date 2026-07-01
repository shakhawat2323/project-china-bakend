import bcrypt from "bcryptjs";
import config from "../../config";
import { prisma } from "./prisma";
import { seedRbac } from "./seedRbac";

const assignSystemRole = async (userId: string, roleSlug: string) => {
    const accessRole = await prisma.accessRole.findUnique({
        where: { slug: roleSlug },
    });

    if (!accessRole) {
        return;
    }

    await prisma.userAccessRole.upsert({
        where: {
            userId_roleId: {
                userId,
                roleId: accessRole.id,
            },
        },
        update: {},
        create: {
            userId,
            roleId: accessRole.id,
        },
    });
};

export const seedSuperAdmin = async () => {
    try {
        await seedRbac();

        const existingSuperAdmin = await prisma.user.findFirst({
            where: { role: "SUPER_ADMIN" },
        });

        if (existingSuperAdmin) {
            await assignSystemRole(existingSuperAdmin.id, "super-admin");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            config.super_admin.password || "superadmin123",
            Number(config.salt_round),
        );

        const superAdmin = await prisma.user.create({
            data: {
                email: config.super_admin.email || "admin@syspcb.com",
                password: hashedPassword,
                role: "SUPER_ADMIN",
                needPasswordChange: true,
                status: "ACTIVE",
                isVerified: true,
                name: "Super Admin",
            },
        });

        await assignSystemRole(superAdmin.id, "super-admin");

        console.log("Super Admin seeded successfully");
    } catch (error) {
        console.error("Error seeding Super Admin:", error);
    }
};
