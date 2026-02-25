import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Helper to get workspace ID from session
async function getWorkspaceId() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });

    return membership?.workspaceId ?? null;
}

// GET /api/brands — list all brands for workspace
export async function GET(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const stage = searchParams.get("stage") || "";
        const sortBy = searchParams.get("sortBy") || "updatedAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { workspaceId };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { contactName: { contains: search, mode: "insensitive" } },
                { industry: { contains: search, mode: "insensitive" } },
            ];
        }

        if (stage) {
            where.pipelineStage = stage;
        }

        const brands = await prisma.brand.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            include: {
                _count: { select: { campaigns: true, emails: true } },
            },
        });

        return NextResponse.json(brands);
    } catch (error) {
        console.error("Error fetching brands:", error);
        return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
    }
}

// POST /api/brands — create a new brand
export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const brand = await prisma.brand.create({
            data: {
                workspaceId,
                name: body.name,
                industry: body.industry || null,
                website: body.website || null,
                contactName: body.contactName || null,
                contactTitle: body.contactTitle || null,
                contactEmail: body.contactEmail || null,
                contactPhone: body.contactPhone || null,
                source: body.source || null,
                estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
                pipelineStage: body.pipelineStage || "research",
                notes: body.notes || null,
                tags: body.tags || [],
            },
        });

        // Log activity
        const session = await auth();
        await prisma.activity.create({
            data: {
                workspaceId,
                type: "brand_created",
                description: `Added ${brand.name} to pipeline`,
                brandId: brand.id,
                userId: session?.user?.id,
            },
        });

        return NextResponse.json(brand, { status: 201 });
    } catch (error) {
        console.error("Error creating brand:", error);
        return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
    }
}
