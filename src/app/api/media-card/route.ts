import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await prisma.membership.findFirst({
            where: { userId: session.user.id },
            include: { workspace: true },
        });

        if (!membership) {
            return NextResponse.json({ error: "No workspace found" }, { status: 404 });
        }

        const workspaceId = membership.workspaceId;

        // Fetch all data needed for the media card
        const [brandProfile, platforms, caseStudies, testimonials] = await Promise.all([
            prisma.brandProfile.findUnique({
                where: { workspaceId },
            }),
            prisma.platform.findMany({
                where: { workspaceId },
                orderBy: { followers: "desc" },
            }),
            prisma.caseStudy.findMany({
                where: { workspaceId },
                select: {
                    brandName: true,
                    industry: true,
                    result: true,
                    resultMetric: true,
                    description: true,
                    imageUrl: true,
                    contentUrl: true,
                    featured: true,
                },
                orderBy: { featured: "desc" },
            }),
            prisma.testimonial.findMany({
                where: { workspaceId },
                select: {
                    quote: true,
                    authorName: true,
                    authorTitle: true,
                    company: true,
                    featured: true,
                },
                orderBy: { featured: "desc" },
                take: 3,
            }),
        ]);

        if (!brandProfile) {
            return NextResponse.json({ error: "No brand profile found" }, { status: 404 });
        }

        // Compute totals
        const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
        const avgEngagement =
            platforms.length > 0
                ? platforms.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / platforms.length
                : 0;

        return NextResponse.json({
            slug: membership.workspace.slug,
            brand: {
                name: brandProfile.brandName,
                tagline: brandProfile.tagline,
                bio: brandProfile.bio,
                location: brandProfile.location,
                contactEmail: brandProfile.contactEmail,
                website: brandProfile.website,
                logoUrl: brandProfile.logoUrl,
                heroImageUrl: brandProfile.heroImageUrl,
                primaryColor: brandProfile.primaryColor || "#ea3382",
                contentCategories: brandProfile.contentCategories || [],
                audienceSummary: brandProfile.audienceSummary,
            },
            platforms: platforms.map((p) => ({
                type: p.type,
                handle: p.handle,
                followers: p.followers,
                avgViews: p.avgViews,
                engagementRate: p.engagementRate,
            })),
            brandPartners: caseStudies.map((cs) => cs.brandName),
            portfolio: caseStudies.map((cs) => ({
                brandName: cs.brandName,
                result: cs.result,
                resultMetric: cs.resultMetric,
                description: cs.description,
                imageUrl: cs.imageUrl,
                contentUrl: cs.contentUrl,
            })),
            testimonials: testimonials.map((t) => ({
                quote: t.quote,
                authorName: t.authorName,
                authorTitle: t.authorTitle,
                company: t.company,
            })),
            totals: {
                followers: totalFollowers,
                avgEngagement: Math.round(avgEngagement * 100) / 100,
                platformCount: platforms.length,
            },
        });
    } catch (error) {
        console.error("Media card API error:", error);
        return NextResponse.json(
            { error: "Failed to load media card data" },
            { status: 500 }
        );
    }
}
