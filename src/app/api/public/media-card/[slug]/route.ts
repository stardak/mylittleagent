import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public media card endpoint — no auth required
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const workspace = await prisma.workspace.findUnique({
            where: { slug },
            include: {
                brandProfile: true,
                platforms: { orderBy: { followers: "desc" } },
                caseStudies: {
                    select: {
                        brandName: true,
                        result: true,
                        resultMetric: true,
                        description: true,
                        imageUrl: true,
                        contentUrl: true,
                        featured: true,
                    },
                    orderBy: { featured: "desc" },
                },
                testimonials: {
                    select: {
                        quote: true,
                        authorName: true,
                        authorTitle: true,
                        company: true,
                        featured: true,
                    },
                    orderBy: { featured: "desc" },
                    take: 3,
                },
            },
        });

        if (!workspace || !workspace.brandProfile) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const bp = workspace.brandProfile;
        const platforms = workspace.platforms;
        const caseStudies = workspace.caseStudies;
        const testimonials = workspace.testimonials;

        const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
        const avgEngagement =
            platforms.length > 0
                ? platforms.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / platforms.length
                : 0;

        const responseBody = {
            brand: {
                name: bp.brandName,
                tagline: bp.tagline,
                bio: bp.bio,
                location: bp.location,
                contactEmail: bp.contactEmail,
                website: bp.website,
                logoUrl: bp.logoUrl,
                heroImageUrl: bp.heroImageUrl,
                primaryColor: bp.primaryColor || "#ea3382",
                contentCategories: bp.contentCategories || [],
                audienceSummary: bp.audienceSummary,
            },
            platforms: platforms.map((p) => ({
                type: p.type,
                handle: p.handle,
                followers: p.followers,
                avgViews: p.avgViews,
                engagementRate: p.engagementRate,
            })),
            brandPartners: [
                ...(bp.previousBrands || []),
                ...caseStudies.map((cs) => cs.brandName).filter(
                    (name) => !(bp.previousBrands || []).includes(name)
                ),
            ],
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
        };

        return NextResponse.json(responseBody, {
            headers: {
                // CDN caches per slug for 60 s; serves stale for up to 5 min while revalidating
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Public media card error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
