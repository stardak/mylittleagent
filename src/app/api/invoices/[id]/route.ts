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

// ── GET /api/invoices/[id] ─────────────────────────────────────────────────
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoice = await prisma.invoice.findFirst({
        where: { id, workspaceId },
        include: {
            campaign: { select: { name: true, brand: { select: { name: true } } } },
        },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
}

// ── PATCH /api/invoices/[id] ───────────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Handle status transitions that set timestamps
    const data: Record<string, unknown> = { ...body };
    if (body.status === "settled" && !body.paidAt) {
        data.paidAt = new Date();
    }
    if (body.status === "submitted" && !body.sentAt) {
        data.sentAt = new Date();
    }

    const invoice = await prisma.invoice.update({
        where: { id },
        data,
        include: {
            campaign: { select: { name: true, brand: { select: { name: true } } } },
        },
    });

    return NextResponse.json(invoice);
}

// ── DELETE /api/invoices/[id] ──────────────────────────────────────────────
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
