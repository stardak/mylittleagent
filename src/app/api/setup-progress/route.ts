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
            return NextResponse.json({ steps: {} });
        }

        const workspaceId = membership.workspaceId;

        // Fetch all data in parallel
        const [brandProfile, platforms, caseStudies, testimonials, settings] = await Promise.all([
            prisma.brandProfile.findUnique({ where: { workspaceId } }),
            prisma.platform.findMany({ where: { workspaceId } }),
            prisma.caseStudy.findMany({ where: { workspaceId } }),
            prisma.testimonial.findMany({ where: { workspaceId } }),
            prisma.setting.findMany({ where: { workspaceId } }),
        ]);

        const getSettingValue = (key: string) => settings.find((s: { key: string; value: string }) => s.key === key)?.value;

        // Determine completion for each step — checks are strict to avoid false positives
        const hasMeaningfulBrandName = !!(brandProfile?.brandName && brandProfile.brandName !== "My Brand" && brandProfile.brandName.trim().length > 0);

        const steps: Record<string, boolean> = {
            // Brand Profile: must have a real brand name (not the API-key default) + at least tagline or bio
            "Brand Profile": hasMeaningfulBrandName && !!(brandProfile?.tagline?.trim() || brandProfile?.bio?.trim()),

            // Platforms: must have at least one platform with a handle
            "Platforms": platforms.some((p: { handle?: string | null }) => p.handle && p.handle.trim().length > 0),

            // Audience: must have a real audience summary (not just whitespace)
            "Audience": !!(brandProfile?.audienceSummary && brandProfile.audienceSummary.trim().length >= 20),

            // Past Work: must have at least one case study with a brand name
            "Past Work": caseStudies.some((cs: { brandName?: string | null }) => cs.brandName && cs.brandName.trim().length > 0),

            // Testimonials: must have at least one testimonial with a quote
            "Testimonials": testimonials.some((t: { quote?: string | null }) => t.quote && t.quote.trim().length > 0),

            // Business Details: must have businessName (real name, not empty)
            "Business Details": !!(brandProfile?.businessName && brandProfile.businessName.trim().length > 0),

            // Rate Card: must have rate card data (not empty)
            "Rate Card": !!(brandProfile?.rateCard && JSON.stringify(brandProfile.rateCard).length > 5),

            // AI Manager: must have encrypted API key
            "AI Manager": !!(brandProfile?.anthropicApiKey),

            // Email Setup: must have email from name or signature configured
            "Email Setup": !!(getSettingValue("email_from_name") || getSettingValue("email_signature")),
        };

        return NextResponse.json({ steps });
    } catch (error) {
        console.error("Setup progress error:", error);
        return NextResponse.json({ steps: {} }, { status: 500 });
    }
}
