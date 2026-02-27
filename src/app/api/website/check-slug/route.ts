/**
 * GET /api/website/check-slug?slug=xxx
 * Returns { available: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const slug = req.nextUrl.searchParams.get("slug");
        if (!slug || slug.length < 2) {
            return NextResponse.json({ available: false, error: "Slug too short" });
        }

        const sanitized = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        const existing = await prisma.creatorWebsite.findUnique({ where: { slug: sanitized } });

        // Also fetch current user's website to allow keeping their own slug
        const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
        const myWebsite = membership
            ? await prisma.creatorWebsite.findUnique({ where: { workspaceId: membership.workspaceId } })
            : null;

        const available = !existing || existing.workspaceId === myWebsite?.workspaceId;
        return NextResponse.json({ available, slug: sanitized });
    } catch (error) {
        console.error("check-slug error:", error);
        return NextResponse.json({ available: false }, { status: 500 });
    }
}
