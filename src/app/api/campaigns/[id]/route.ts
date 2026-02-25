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

// GET /api/campaigns/[id] — get single campaign with all related data
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const campaign = await prisma.campaign.findFirst({
            where: { id, workspaceId },
            include: {
                brand: true,
                deliverables: { orderBy: { dueDate: "asc" } },
                invoices: { orderBy: { createdAt: "desc" } },
                tasks: { orderBy: { dueDate: "asc" } },
                activities: { orderBy: { createdAt: "desc" }, take: 20 },
                _count: { select: { deliverables: true, invoices: true, tasks: true, files: true } },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json(campaign);
    } catch (error) {
        console.error("Error fetching campaign:", error);
        return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
    }
}

// PATCH /api/campaigns/[id] — update a campaign
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Verify ownership
        const existing = await prisma.campaign.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const statusChanged = body.status && body.status !== existing.status;

        const campaign = await prisma.campaign.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.brief !== undefined && { brief: body.brief }),
                ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
                ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
                ...(body.fee !== undefined && { fee: body.fee ? parseFloat(body.fee) : null }),
                ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms }),
                ...(body.usageRights !== undefined && { usageRights: body.usageRights }),
                ...(body.exclusivity !== undefined && { exclusivity: body.exclusivity }),
                ...(body.revisionPolicy !== undefined && { revisionPolicy: body.revisionPolicy }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.contractStatus !== undefined && { contractStatus: body.contractStatus }),
                ...(body.contractUrl !== undefined && { contractUrl: body.contractUrl }),
            },
            include: {
                brand: { select: { id: true, name: true, industry: true } },
                deliverables: { orderBy: { dueDate: "asc" } },
                _count: { select: { deliverables: true, invoices: true, tasks: true } },
            },
        });

        // Log status change activity
        if (statusChanged) {
            const session = await auth();
            await prisma.activity.create({
                data: {
                    workspaceId,
                    type: "campaign_status_changed",
                    description: `Changed "${campaign.name}" status from "${existing.status}" to "${body.status}"`,
                    brandId: campaign.brandId,
                    campaignId: campaign.id,
                    userId: session?.user?.id,
                },
            });
        }

        return NextResponse.json(campaign);
    } catch (error) {
        console.error("Error updating campaign:", error);
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
}

// DELETE /api/campaigns/[id] — delete a campaign (cascade deletes deliverables)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const existing = await prisma.campaign.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        await prisma.campaign.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
    }
}
