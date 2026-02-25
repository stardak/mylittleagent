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

// GET /api/outreach — list all outreach records for the workspace
export async function GET(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { workspaceId };

        if (search) {
            where.OR = [
                { brandName: { contains: search, mode: "insensitive" } },
                { product: { contains: search, mode: "insensitive" } },
                { contactEmail: { contains: search, mode: "insensitive" } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const outreaches = await prisma.outreach.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            include: {
                brand: { select: { id: true, name: true, industry: true } },
            },
        });

        return NextResponse.json(outreaches);
    } catch (error) {
        console.error("Error fetching outreach:", error);
        return NextResponse.json({ error: "Failed to fetch outreach" }, { status: 500 });
    }
}

// POST /api/outreach — create a new outreach (Step 1 Brand Brief)
export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        if (!body.brandName?.trim()) {
            return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
        }
        if (!body.contactEmail?.trim()) {
            return NextResponse.json({ error: "Contact email is required" }, { status: 400 });
        }
        if (!body.product?.trim()) {
            return NextResponse.json({ error: "Product/service is required" }, { status: 400 });
        }

        // Optionally link to an existing Brand record
        let brandId: string | null = null;
        if (body.brandId) {
            const brand = await prisma.brand.findFirst({
                where: { id: body.brandId, workspaceId },
            });
            if (brand) brandId = brand.id;
        }

        const outreach = await prisma.outreach.create({
            data: {
                workspaceId,
                brandId,
                brandName: body.brandName.trim(),
                contactEmail: body.contactEmail.trim(),
                product: body.product.trim(),
                fitReason: body.fitReason?.trim() || null,
                brandIndustry: body.brandIndustry?.trim() || null,
                brandUrl: body.brandUrl?.trim() || null,
                includeMediaCard: body.includeMediaCard === true,
                status: "draft",
            },
        });

        // Log activity
        const session = await auth();
        await prisma.activity.create({
            data: {
                workspaceId,
                type: "outreach_created",
                description: `Created outreach to ${outreach.brandName}`,
                brandId,
                userId: session?.user?.id,
            },
        });

        return NextResponse.json(outreach, { status: 201 });
    } catch (error) {
        console.error("Error creating outreach:", error);
        return NextResponse.json({ error: "Failed to create outreach" }, { status: 500 });
    }
}
