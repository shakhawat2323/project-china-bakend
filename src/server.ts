import { Server } from "http";
import app from "./app";
import config from "./config";
import { prisma } from "./app/shared/prisma";
import { seedSuperAdmin } from "./app/shared/seedSuperAdmin";
import { socketManager } from "./app/shared/socket";

let server: Server;

async function bootstrap() {
    try {
        await prisma.$connect();
        console.log("🛢️  Database is connected successfully");

        await seedSuperAdmin();

        server = app.listen(config.port, () => {
            console.log(`🚀 Application listening on port ${config.port}`);
        });

        // Initialize Socket.io
        socketManager.init(server);
    } catch (err) {
        console.error("❌ Failed to connect database", err);
    }
}

bootstrap();

process.on("unhandledRejection", (error) => {
    console.log("😈 unhandledRejection is detected, shutting down ...");
    if (server) {
        server.close(() => {
            console.error(error);
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on("uncaughtException", (error) => {
    console.log("😈 uncaughtException is detected, shutting down ...");
    console.error(error);
    process.exit(1);
});
