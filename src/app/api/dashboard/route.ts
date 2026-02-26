/**
 * GET /api/dashboard
 * Returns live stats + recent activity for the dashboard homepage.
 */
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

export async function GET() {
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
        brands,
        invoices,
        deliverables,
        activities,
    ] = await Promise.all([
        prisma.brand.findMany({
            where: { workspaceId },
            select: { estimatedValue: true, pipelineStage: true },
        }),
        prisma.invoice.findMany({
            where: {
                workspaceId,
                status: "paid",
                paidAt: { gte: startOfMonth },
            },
            select: { total: true },
        }),
        prisma.deliverable.findMany({
            where: {
                campaign: { workspaceId },
                dueDate: { lte: in7Days, gte: now },
                status: { notIn: ["delivered", "approved"] },
            },
            select: { id: true },
        }),
        prisma.activity.findMany({
            where: { workspaceId },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                type: true,
                description: true,
                createdAt: true,
                brand: { select: { name: true } },
            },
        }),
    ]);

    const pipelineValue = brands.reduce((sum, b) => sum + (b.estimatedValue ?? 0), 0);
    const activeBrands = brands.filter((b) => !["lost", "paid"].includes(b.pipelineStage)).length;
    const revenueMTD = invoices.reduce((sum, i) => sum + i.total, 0);

    return NextResponse.json({
        stats: {
            pipelineValue,
            activeBrands,
            revenueMTD,
            deliverablesDue: deliverables.length,
        },
        activities: activities.map((a) => ({
            id: a.id,
            type: a.type,
            description: a.description,
            createdAt: a.createdAt.toISOString(),
            brandName: a.brand?.name ?? null,
        })),
    });
}
