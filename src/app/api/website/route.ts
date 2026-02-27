/**
 * GET  /api/website  — fetch (or auto-create) the CreatorWebsite for the authenticated workspace
 * POST /api/website  — update website config
 */

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

const DEFAULT_SECTIONS = [
    { id: "hero", visible: true },
    { id: "about", visible: true },
    { id: "stats", visible: true },
    { id: "work", visible: true },
    { id: "services", visible: true },
    { id: "partners", visible: true },
    { id: "testimonials", visible: true },
    { id: "contact", visible: true },
];

export async function GET() {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Auto-create from workspace slug if not yet existing
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                brandProfile: true,
                platforms: { orderBy: { followers: "desc" } },
                caseStudies: { orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
                testimonials: { orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
            },
        });
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        const website = await prisma.creatorWebsite.upsert({
            where: { workspaceId },
            update: {},
            create: {
                workspaceId,
                slug: workspace.slug,
                sections: DEFAULT_SECTIONS,
            },
        });

        return NextResponse.json({
            website,
            profile: workspace.brandProfile,
            platforms: workspace.platforms,
            caseStudies: workspace.caseStudies,
            testimonials: workspace.testimonials,
        });
    } catch (error) {
        console.error("GET /api/website error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { isPublished, slug, heroVideoUrl, sections, theme, seoTitle, seoDescription } = body;

        // If slug is being changed, verify uniqueness
        if (slug !== undefined) {
            const existing = await prisma.creatorWebsite.findUnique({ where: { slug } });
            const current = await prisma.creatorWebsite.findUnique({ where: { workspaceId } });
            if (existing && existing.workspaceId !== workspaceId && existing.slug !== current?.slug) {
                return NextResponse.json({ error: "This URL is already taken. Please choose a different one." }, { status: 409 });
            }
        }

        const website = await prisma.creatorWebsite.update({
            where: { workspaceId },
            data: {
                ...(isPublished !== undefined && { isPublished }),
                ...(slug !== undefined && { slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") }),
                ...(heroVideoUrl !== undefined && { heroVideoUrl }),
                ...(sections !== undefined && { sections }),
                ...(theme !== undefined && { theme }),
                ...(seoTitle !== undefined && { seoTitle }),
                ...(seoDescription !== undefined && { seoDescription }),
            },
        });

        return NextResponse.json({ website });
    } catch (error) {
        console.error("POST /api/website error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
