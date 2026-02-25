import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";
        const plan = url.searchParams.get("plan") || "";
        const status = url.searchParams.get("status") || "";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");

        // Build user filter
        const userWhere: any = {};
        if (search) {
            userWhere.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Get users with workspace info
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: userWhere,
                include: {
                    memberships: {
                        include: {
                            workspace: {
                                select: {
                                    name: true,
                                    slug: true,
                                    plan: true,
                                    subscriptionStatus: true,
                                    trialEndsAt: true,
                                },
                            },
                        },
                    },
                    discountRedemptions: {
                        include: {
                            discountCode: { select: { code: true } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where: userWhere }),
        ]);

        // Filter by plan after fetching (since plan is on workspace, not user)
        let filteredUsers = users.map((u) => {
            const primaryWorkspace = u.memberships[0]?.workspace;
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                createdAt: u.createdAt,
                lastLoginAt: u.lastLoginAt,
                isAdmin: u.isAdmin,
                workspace: primaryWorkspace
                    ? {
                        name: primaryWorkspace.name,
                        slug: primaryWorkspace.slug,
                        plan: primaryWorkspace.plan,
                        subscriptionStatus: primaryWorkspace.subscriptionStatus || "active",
                        trialEndsAt: primaryWorkspace.trialEndsAt,
                    }
                    : null,
                discountCodes: u.discountRedemptions.map((r) => r.discountCode.code),
            };
        });

        if (plan) {
            filteredUsers = filteredUsers.filter((u) => u.workspace?.plan === plan);
        }

        return NextResponse.json({
            users: filteredUsers,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("Admin users error:", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
