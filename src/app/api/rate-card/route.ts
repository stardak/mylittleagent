import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { auth } from "../../../lib/auth";

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

        // Fetch all data needed for the rate card (similar to media card but includes rateCard JSON)
        const [brandProfile, platforms] = await Promise.all([
            prisma.brandProfile.findUnique({
                where: { workspaceId },
            }),
            prisma.platform.findMany({
                where: { workspaceId },
                orderBy: { followers: "desc" },
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
                contactEmail: brandProfile.contactEmail,
                logoUrl: brandProfile.logoUrl,
                heroImageUrl: brandProfile.heroImageUrl,
                primaryColor: brandProfile.primaryColor || "#ea3382",
                audienceSummary: brandProfile.audienceSummary,
                location: brandProfile.location,
            },
            platforms: platforms.map((p) => ({
                type: p.type,
                handle: p.handle,
                followers: p.followers,
                avgViews: p.avgViews,
                engagementRate: p.engagementRate,
                demographics: p.demographics,
                genderFemale: p.genderFemale,
                ageRange1: p.ageRange1,
                ageRange1Pct: p.ageRange1Pct,
                topCountry1: p.topCountry1,
                topCountry1Pct: p.topCountry1Pct,
            })),
            totals: {
                followers: totalFollowers,
                avgEngagement: Math.round(avgEngagement * 100) / 100,
                platformCount: platforms.length,
            },
            // The JSON field mapping exactly to our new structured format
            rateCard: brandProfile.rateCard || [],
        });
    } catch (error) {
        console.error("Rate card API error:", error);
        return NextResponse.json(
            { error: "Failed to load rate card data" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
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
        const body = await req.json();

        // Expect an array of package objects
        if (!body.rateCard || !Array.isArray(body.rateCard)) {
            return NextResponse.json({ error: "Invalid rate card data" }, { status: 400 });
        }

        const updatedProfile = await prisma.brandProfile.update({
            where: { workspaceId },
            data: {
                rateCard: body.rateCard,
            },
        });

        return NextResponse.json({
            success: true,
            rateCard: updatedProfile.rateCard,
        });
    } catch (error) {
        console.error("Rate card API PUT error:", error);
        return NextResponse.json(
            { error: "Failed to update rate card data" },
            { status: 500 }
        );
    }
}
