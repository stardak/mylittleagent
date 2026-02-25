import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";

        const where: any = {};
        if (search) {
            where.code = { contains: search, mode: "insensitive" };
        }

        const codes = await prisma.discountCode.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { redemptions: true } },
            },
        });

        return NextResponse.json({
            codes: codes.map((c) => ({
                id: c.id,
                code: c.code,
                type: c.type,
                value: c.value,
                appliesTo: c.appliesTo,
                duration: c.duration,
                durationMonths: c.durationMonths,
                maxRedemptions: c.maxRedemptions,
                perUserLimit: c.perUserLimit,
                expiresAt: c.expiresAt,
                isActive: c.isActive,
                timesUsed: c._count.redemptions,
                createdAt: c.createdAt,
            })),
        });
    } catch (err) {
        console.error("Admin discounts error:", err);
        return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await req.json();
        const {
            code,
            type,
            value,
            appliesTo = [],
            duration = "first_month",
            durationMonths,
            maxRedemptions,
            perUserLimit = 1,
            expiresAt,
        } = body;

        if (!code || !type || value == null) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check for duplicate code
        const existing = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });
        if (existing) {
            return NextResponse.json({ error: "Code already exists" }, { status: 409 });
        }

        const discount = await prisma.discountCode.create({
            data: {
                code: code.toUpperCase(),
                type,
                value: parseFloat(value),
                appliesTo,
                duration,
                durationMonths: durationMonths ? parseInt(durationMonths) : null,
                maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
                perUserLimit: parseInt(perUserLimit),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        return NextResponse.json({ discount }, { status: 201 });
    } catch (err) {
        console.error("Create discount error:", err);
        return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
    }
}
