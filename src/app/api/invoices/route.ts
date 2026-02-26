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

// ── GET /api/invoices ──────────────────────────────────────────────────────
export async function GET() {
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoices = await prisma.invoice.findMany({
        where: { workspaceId },
        include: {
            campaign: { select: { name: true, brand: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
}

// ── POST /api/invoices ─────────────────────────────────────────────────────
export async function POST(req: Request) {
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const {
            clientName,
            campaignId,
            invoiceNumber,
            issueDate,
            dueDate,
            lineItems,
            subtotal,
            vatRate,
            vatAmount,
            total,
            currency = "GBP",
            notes,
            status = "draft",
        } = body;

        if (!invoiceNumber || !dueDate || !lineItems || total === undefined) {
            return NextResponse.json(
                { error: "invoiceNumber, dueDate, lineItems and total are required" },
                { status: 400 }
            );
        }

        // Auto-generate invoice number if a collision would occur
        const existing = await prisma.invoice.findUnique({
            where: { workspaceId_invoiceNumber: { workspaceId, invoiceNumber } },
        });

        const finalInvoiceNumber = existing
            ? `${invoiceNumber}-${Date.now().toString().slice(-4)}`
            : invoiceNumber;

        const invoice = await prisma.invoice.create({
            data: {
                workspaceId,
                clientName: clientName || null,
                campaignId: campaignId || null,
                invoiceNumber: finalInvoiceNumber,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                dueDate: new Date(dueDate),
                lineItems,
                subtotal: Number(subtotal),
                vatRate: vatRate != null ? Number(vatRate) : null,
                vatAmount: vatAmount != null ? Number(vatAmount) : null,
                total: Number(total),
                currency,
                notes: notes || null,
                status,
            },
            include: {
                campaign: { select: { name: true, brand: { select: { name: true } } } },
            },
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (err) {
        console.error("Invoice create error:", err);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
