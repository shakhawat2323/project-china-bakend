import { TicketStatus, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import { NotificationService } from "../notification/notification.service";
import { socketManager } from "../../shared/socket";

type Actor = {
    id: string;
    role: UserRole;
};

const createTicket = async (userId: string, payload: { subject: string; message: string }) => {
    const ticket = await prisma.ticket.create({
        data: {
            userId,
            subject: payload.subject,
            messages: {
                create: {
                    senderId: userId,
                    message: payload.message,
                },
            },
        },
        include: { messages: true },
    });

    await NotificationService.createNotification({
        userId,
        title: "Support ticket created",
        message: `Your ticket "${ticket.subject}" has been created.`,
        type: "SUCCESS",
        link: `/tickets/${ticket.id}`,
    });

    return ticket;
};

const getMyTickets = async (userId: string) => {
    return prisma.ticket.findMany({
        where: { userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
    });
};

const getAllTickets = async () => {
    return prisma.ticket.findMany({
        include: {
            user: { select: { id: true, name: true, email: true, companyName: true } },
            messages: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
    });
};

const getTicketById = async (ticketId: string, actor: Actor) => {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            user: { select: { id: true, name: true, email: true, companyName: true } },
            messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true, role: true } } } },
        },
    });

    if (!ticket) {
        throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && ticket.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot access another customer's ticket.");
    }

    return ticket;
};

const replyTicket = async (ticketId: string, actor: Actor, message: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
        throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && ticket.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot reply to another customer's ticket.");
    }

    const result = await prisma.$transaction(async (tx) => {
        const ticketMessage = await tx.ticketMessage.create({
            data: {
                ticketId,
                senderId: actor.id,
                message,
            },
        });

        await tx.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.IN_PROGRESS },
        });

        return ticketMessage;
    });

    await NotificationService.createNotification({
        userId: ticket.userId,
        title: "Ticket reply received",
        message: "A new reply has been added to your support ticket.",
        type: "MESSAGE",
        link: `/tickets/${ticket.id}`,
    });

    socketManager.emitToUser(ticket.userId, "ticket:reply", {
        ticketId,
        message: result,
    });

    return result;
};

const closeTicket = async (ticketId: string, actor: Actor) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
        throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && ticket.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot close another customer's ticket.");
    }

    const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.CLOSED },
    });

    socketManager.emitToUser(ticket.userId, "ticket:closed", updatedTicket);

    return updatedTicket;
};

export const SupportService = {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketById,
    replyTicket,
    closeTicket,
};
