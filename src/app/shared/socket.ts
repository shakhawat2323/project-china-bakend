import { Server as HttpServer } from "http";
import { Secret } from "jsonwebtoken";
import { Server as SocketIOServer, Socket } from "socket.io";
import config from "../../config";
import { jwtHelper } from "../helper/jwtHelper";

type SocketUser = {
    id: string;
    email?: string;
    role?: string;
};

type AuthenticatedSocket = Socket & {
    user?: SocketUser;
};

const userRoom = (userId: string) => `user:${userId}`;
const chatRoom = (roomId: string) => `chat:${roomId}`;
const orderRoom = (orderId: string) => `order:${orderId}`;

class SocketManager {
    private io: SocketIOServer | null = null;
    private onlineUsers: Map<string, Set<string>> = new Map();

    public init(server: HttpServer) {
        const allowedOrigins = [config.frontend_url, "http://localhost:3000", "https://wupingfeitian.vercel.app"].filter(Boolean);

        this.io = new SocketIOServer(server, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST", "PATCH"],
                credentials: true,
            },
        });

        this.io.use((socket: AuthenticatedSocket, next) => {
            try {
                const token =
                    socket.handshake.auth?.token ||
                    socket.handshake.headers.authorization?.replace("Bearer ", "");

                if (!token) {
                    return next(new Error("Authentication token is required."));
                }

                const verified = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret);
                const userId = String(verified.id || verified.userId);

                if (!userId) {
                    return next(new Error("Invalid authentication token."));
                }

                socket.user = {
                    id: userId,
                    email: verified.email as string,
                    role: verified.role as string,
                };

                next();
            } catch {
                next(new Error("Invalid or expired authentication token."));
            }
        });

        this.io.on("connection", (socket: AuthenticatedSocket) => {
            if (!socket.user?.id) {
                socket.disconnect(true);
                return;
            }

            this.addOnlineSocket(socket.user.id, socket.id);
            socket.join(userRoom(socket.user.id));
            this.emitPresence(socket.user.id, true);

            socket.on("chat:join", (roomId: string) => {
                socket.join(chatRoom(roomId));
            });

            socket.on("chat:leave", (roomId: string) => {
                socket.leave(chatRoom(roomId));
            });

            socket.on("chat:typing", (payload: { roomId: string; isTyping: boolean }) => {
                socket.to(chatRoom(payload.roomId)).emit("chat:typing", {
                    roomId: payload.roomId,
                    userId: socket.user?.id,
                    isTyping: payload.isTyping,
                });
            });

            socket.on("order:join", (orderId: string) => {
                socket.join(orderRoom(orderId));
            });

            socket.on("order:leave", (orderId: string) => {
                socket.leave(orderRoom(orderId));
            });

            socket.on("disconnect", () => {
                if (!socket.user?.id) return;
                this.removeOnlineSocket(socket.user.id, socket.id);
                this.emitPresence(socket.user.id, this.isUserOnline(socket.user.id));
            });
        });
    }

    public getIO() {
        return this.io;
    }

    public emitToUser(userId: string, eventName: string, payload: unknown) {
        this.io?.to(userRoom(userId)).emit(eventName, payload);
    }

    public emitToChatRoom(roomId: string, eventName: string, payload: unknown) {
        this.io?.to(chatRoom(roomId)).emit(eventName, payload);
    }

    public emitToOrder(orderId: string, eventName: string, payload: unknown) {
        this.io?.to(orderRoom(orderId)).emit(eventName, payload);
    }

    public emitPresence(userId: string, isOnline: boolean) {
        this.io?.emit("presence:update", { userId, isOnline });
    }

    public isUserOnline(userId: string) {
        return Boolean(this.onlineUsers.get(userId)?.size);
    }

    private addOnlineSocket(userId: string, socketId: string) {
        const socketSet = this.onlineUsers.get(userId) || new Set<string>();
        socketSet.add(socketId);
        this.onlineUsers.set(userId, socketSet);
    }

    private removeOnlineSocket(userId: string, socketId: string) {
        const socketSet = this.onlineUsers.get(userId);
        if (!socketSet) return;

        socketSet.delete(socketId);
        if (!socketSet.size) {
            this.onlineUsers.delete(userId);
        }
    }
}

export const socketManager = new SocketManager();
