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

// GET /api/campaigns — list campaigns for workspace
export async function GET(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get("brandId") || "";
        const status = searchParams.get("status") || "";
        const search = searchParams.get("search") || "";
        const sortBy = searchParams.get("sortBy") || "updatedAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { workspaceId };

        if (brandId) {
            where.brandId = brandId;
        }

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { brief: { contains: search, mode: "insensitive" } },
            ];
        }

        const campaigns = await prisma.campaign.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            include: {
                brand: { select: { id: true, name: true, industry: true } },
                _count: { select: { deliverables: true, invoices: true, tasks: true } },
            },
        });

        return NextResponse.json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}

// POST /api/campaigns — create a new campaign
export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        if (!body.name || !body.brandId) {
            return NextResponse.json(
                { error: "name and brandId are required" },
                { status: 400 }
            );
        }

        // Verify the brand belongs to this workspace
        const brand = await prisma.brand.findFirst({
            where: { id: body.brandId, workspaceId },
        });

        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        const campaign = await prisma.campaign.create({
            data: {
                workspaceId,
                brandId: body.brandId,
                name: body.name,
                brief: body.brief || null,
                startDate: body.startDate ? new Date(body.startDate) : null,
                endDate: body.endDate ? new Date(body.endDate) : null,
                fee: body.fee ? parseFloat(body.fee) : null,
                paymentTerms: body.paymentTerms || null,
                usageRights: body.usageRights || null,
                exclusivity: body.exclusivity || null,
                revisionPolicy: body.revisionPolicy || null,
                status: body.status || "draft",
            },
            include: {
                brand: { select: { id: true, name: true, industry: true } },
                _count: { select: { deliverables: true, invoices: true, tasks: true } },
            },
        });

        // Log activity
        const session = await auth();
        await prisma.activity.create({
            data: {
                workspaceId,
                type: "campaign_created",
                description: `Created campaign "${campaign.name}" for ${brand.name}`,
                brandId: brand.id,
                campaignId: campaign.id,
                userId: session?.user?.id,
            },
        });

        return NextResponse.json(campaign, { status: 201 });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }
}
