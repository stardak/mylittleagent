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

// GET /api/deliverables — list deliverables with filters
export async function GET(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get("campaignId") || "";
        const status = searchParams.get("status") || "";
        const platform = searchParams.get("platform") || "";
        const dueBefore = searchParams.get("dueBefore") || "";
        const dueAfter = searchParams.get("dueAfter") || "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            campaign: { workspaceId },
        };

        if (campaignId) {
            where.campaignId = campaignId;
        }

        if (status) {
            where.status = status;
        }

        if (platform) {
            where.platform = platform;
        }

        if (dueBefore || dueAfter) {
            where.dueDate = {};
            if (dueBefore) where.dueDate.lte = new Date(dueBefore);
            if (dueAfter) where.dueDate.gte = new Date(dueAfter);
        }

        const deliverables = await prisma.deliverable.findMany({
            where,
            orderBy: { dueDate: "asc" },
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

        return NextResponse.json(deliverables);
    } catch (error) {
        console.error("Error fetching deliverables:", error);
        return NextResponse.json({ error: "Failed to fetch deliverables" }, { status: 500 });
    }
}

// POST /api/deliverables — create a new deliverable
export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        if (!body.campaignId || !body.type || !body.platform) {
            return NextResponse.json(
                { error: "campaignId, type, and platform are required" },
                { status: 400 }
            );
        }

        // Verify the campaign belongs to this workspace
        const campaign = await prisma.campaign.findFirst({
            where: { id: body.campaignId, workspaceId },
            include: { brand: { select: { id: true, name: true } } },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const deliverable = await prisma.deliverable.create({
            data: {
                campaignId: body.campaignId,
                type: body.type,
                platform: body.platform,
                assignedTo: body.assignedTo || null,
                description: body.description || null,
                status: body.status || "not_started",
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                reviewDate: body.reviewDate ? new Date(body.reviewDate) : null,
                publishDate: body.publishDate ? new Date(body.publishDate) : null,
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

        // Log activity
        const session = await auth();
        await prisma.activity.create({
            data: {
                workspaceId,
                type: "deliverable_created",
                description: `Added ${body.type} on ${body.platform} to "${campaign.name}"`,
                brandId: campaign.brand.id,
                campaignId: campaign.id,
                userId: session?.user?.id,
            },
        });

        return NextResponse.json(deliverable, { status: 201 });
    } catch (error) {
        console.error("Error creating deliverable:", error);
        return NextResponse.json({ error: "Failed to create deliverable" }, { status: 500 });
    }
}
