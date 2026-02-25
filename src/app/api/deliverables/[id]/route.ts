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

// PATCH /api/deliverables/[id] — update a deliverable
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

        // Verify ownership through campaign → workspace
        const existing = await prisma.deliverable.findFirst({
            where: { id, campaign: { workspaceId } },
            include: {
                campaign: {
                    select: { id: true, name: true, workspaceId: true, brandId: true },
                },
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
        }

        const statusChanged = body.status && body.status !== existing.status;

        const deliverable = await prisma.deliverable.update({
            where: { id },
            data: {
                ...(body.type !== undefined && { type: body.type }),
                ...(body.platform !== undefined && { platform: body.platform }),
                ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
                ...(body.reviewDate !== undefined && { reviewDate: body.reviewDate ? new Date(body.reviewDate) : null }),
                ...(body.publishDate !== undefined && { publishDate: body.publishDate ? new Date(body.publishDate) : null }),
                ...(body.draftUrl !== undefined && { draftUrl: body.draftUrl }),
                ...(body.liveUrl !== undefined && { liveUrl: body.liveUrl }),
                ...(body.clientFeedback !== undefined && { clientFeedback: body.clientFeedback }),
                ...(body.views !== undefined && { views: body.views ? parseInt(body.views) : null }),
                ...(body.likes !== undefined && { likes: body.likes ? parseInt(body.likes) : null }),
                ...(body.comments !== undefined && { comments: body.comments ? parseInt(body.comments) : null }),
                ...(body.shares !== undefined && { shares: body.shares ? parseInt(body.shares) : null }),
                ...(body.saves !== undefined && { saves: body.saves ? parseInt(body.saves) : null }),
                ...(body.clicks !== undefined && { clicks: body.clicks ? parseInt(body.clicks) : null }),
                ...(body.engagementRate !== undefined && { engagementRate: body.engagementRate ? parseFloat(body.engagementRate) : null }),
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        brand: { select: { id: true, name: true } },
                    },
                },
            },
        });

        // Log status change
        if (statusChanged) {
            const session = await auth();
            await prisma.activity.create({
                data: {
                    workspaceId,
                    type: "deliverable_status_changed",
                    description: `Changed ${existing.type} on ${existing.platform} from "${existing.status}" to "${body.status}"`,
                    brandId: existing.campaign.brandId,
                    campaignId: existing.campaign.id,
                    userId: session?.user?.id,
                },
            });
        }

        return NextResponse.json(deliverable);
    } catch (error) {
        console.error("Error updating deliverable:", error);
        return NextResponse.json({ error: "Failed to update deliverable" }, { status: 500 });
    }
}

// DELETE /api/deliverables/[id] — delete a deliverable
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

        const existing = await prisma.deliverable.findFirst({
            where: { id, campaign: { workspaceId } },
        });

        if (!existing) {
            return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
        }

        await prisma.deliverable.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting deliverable:", error);
        return NextResponse.json({ error: "Failed to delete deliverable" }, { status: 500 });
    }
}
