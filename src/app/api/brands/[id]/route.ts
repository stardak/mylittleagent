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

// GET /api/brands/[id] — get single brand with related data
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

        const brand = await prisma.brand.findFirst({
            where: { id, workspaceId },
            include: {
                campaigns: { orderBy: { createdAt: "desc" }, take: 10 },
                emails: { orderBy: { createdAt: "desc" }, take: 10 },
                activities: { orderBy: { createdAt: "desc" }, take: 20 },
                _count: { select: { campaigns: true, emails: true } },
            },
        });

        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json(brand);
    } catch (error) {
        console.error("Error fetching brand:", error);
        return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 });
    }
}

// PATCH /api/brands/[id] — update a brand
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
        const existing = await prisma.brand.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        // Track stage changes for activity log
        const stageChanged = body.pipelineStage && body.pipelineStage !== existing.pipelineStage;

        const brand = await prisma.brand.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.industry !== undefined && { industry: body.industry }),
                ...(body.website !== undefined && { website: body.website }),
                ...(body.contactName !== undefined && { contactName: body.contactName }),
                ...(body.contactTitle !== undefined && { contactTitle: body.contactTitle }),
                ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
                ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
                ...(body.source !== undefined && { source: body.source }),
                ...(body.estimatedValue !== undefined && { estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null }),
                ...(body.pipelineStage !== undefined && { pipelineStage: body.pipelineStage }),
                ...(body.nextFollowUp !== undefined && { nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null }),
                ...(body.nextAction !== undefined && { nextAction: body.nextAction }),
                ...(body.notes !== undefined && { notes: body.notes }),
                ...(body.tags !== undefined && { tags: body.tags }),
                ...(body.lostReason !== undefined && { lostReason: body.lostReason }),
                ...(body.brandFitScore !== undefined && { brandFitScore: body.brandFitScore }),
            },
        });

        // Log stage change activity
        if (stageChanged) {
            const session = await auth();
            await prisma.activity.create({
                data: {
                    workspaceId,
                    type: "stage_changed",
                    description: `Moved ${brand.name} from "${existing.pipelineStage}" to "${body.pipelineStage}"`,
                    brandId: brand.id,
                    userId: session?.user?.id,
                },
            });
        }

        return NextResponse.json(brand);
    } catch (error) {
        console.error("Error updating brand:", error);
        return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
    }
}

// DELETE /api/brands/[id] — delete a brand
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

        const existing = await prisma.brand.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        await prisma.brand.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting brand:", error);
        return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
    }
}
