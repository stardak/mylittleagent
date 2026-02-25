import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getWorkspaceId() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });
    return membership?.workspaceId ?? null;
}

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/conversations/:id — get conversation with messages
 */
export async function GET(req: Request, context: RouteContext) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const conversation = await prisma.conversation.findFirst({
            where: { id, workspaceId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
    }
}

/**
 * DELETE /api/conversations/:id — delete conversation and messages
 */
export async function DELETE(req: Request, context: RouteContext) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const conversation = await prisma.conversation.findFirst({
            where: { id, workspaceId },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        // Cascade delete handles messages
        await prisma.conversation.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }
}

/**
 * PATCH /api/conversations/:id — rename a conversation
 * Body: { title: string }
 */
export async function PATCH(req: Request, context: RouteContext) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const { title } = await req.json();

        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const conversation = await prisma.conversation.findFirst({
            where: { id, workspaceId },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        const updated = await prisma.conversation.update({
            where: { id },
            data: { title: title.trim() },
        });

        return NextResponse.json({ success: true, title: updated.title });
    } catch (error) {
        console.error("Error renaming conversation:", error);
        return NextResponse.json({ error: "Failed to rename conversation" }, { status: 500 });
    }
}
