/**
 * POST /api/ai/website-suggestions
 *
 * AI-powered website copy generator. Uses workspace context to produce
 * per-section copy suggestions. Streams back JSON suggestions.
 * Gated: requires ≥ 5/9 onboarding steps complete AND an Anthropic API key.
 */

import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { buildSystemPrompt } from "@/lib/agent/prompt";

const REQUIRED_STEPS = 5;

async function getOnboardingProgress(workspaceId: string) {
    const [brandProfile, platforms, caseStudies, testimonials, settings] = await Promise.all([
        prisma.brandProfile.findUnique({ where: { workspaceId } }),
        prisma.platform.findMany({ where: { workspaceId } }),
        prisma.caseStudy.findMany({ where: { workspaceId } }),
        prisma.testimonial.findMany({ where: { workspaceId } }),
        prisma.setting.findMany({ where: { workspaceId } }),
    ]);

    const getSettingValue = (key: string) =>
        settings.find((s: { key: string }) => s.key === key)?.value;

    const hasMeaningfulBrandName = !!(
        brandProfile?.brandName &&
        brandProfile.brandName !== "My Brand" &&
        brandProfile.brandName.trim().length > 0
    );

    const stepResults: Record<string, boolean> = {
        "Brand Profile": hasMeaningfulBrandName && !!(brandProfile?.tagline?.trim() || brandProfile?.bio?.trim()),
        "Platforms": platforms.some((p: { handle?: string | null }) => p.handle && p.handle.trim().length > 0),
        "Audience": !!(brandProfile?.audienceSummary && brandProfile.audienceSummary.trim().length >= 20),
        "Past Work": caseStudies.some((cs: { brandName?: string | null }) => cs.brandName && cs.brandName.trim().length > 0),
        "Testimonials": testimonials.some((t: { quote?: string | null }) => t.quote && t.quote.trim().length > 0),
        "Business Details": !!(brandProfile?.businessName && brandProfile.businessName.trim().length > 0),
        "Rate Card": !!(brandProfile?.rateCard && JSON.stringify(brandProfile.rateCard).length > 5),
        "AI Manager": !!(brandProfile?.anthropicApiKey),
        "Email Setup": !!(getSettingValue("email_from_name") || getSettingValue("email_signature")),
    };

    const completedSteps = Object.values(stepResults).filter(Boolean).length;
    const incompleteSteps = Object.entries(stepResults)
        .filter(([, v]) => !v)
        .map(([k]) => k);

    return { completedSteps, total: 9, stepResults, incompleteSteps, brandProfile };
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await prisma.membership.findFirst({
            where: { userId: session.user.id },
        });
        if (!membership) {
            return NextResponse.json({ error: "No workspace found" }, { status: 404 });
        }

        const workspaceId = membership.workspaceId;
        const progress = await getOnboardingProgress(workspaceId);

        if (progress.completedSteps < REQUIRED_STEPS) {
            return NextResponse.json({
                locked: true,
                completedSteps: progress.completedSteps,
                requiredSteps: REQUIRED_STEPS,
                incompleteSteps: progress.incompleteSteps,
                reason: `Complete at least ${REQUIRED_STEPS} setup steps so the AI has enough context to understand your brand. Currently ${progress.completedSteps}/${REQUIRED_STEPS} steps done.`,
            }, { status: 422 });
        }

        if (!progress.brandProfile?.anthropicApiKey) {
            return NextResponse.json({
                locked: true,
                reason: "Set up your AI Manager API key first (Settings → AI).",
            }, { status: 422 });
        }

        const apiKey = decryptApiKey(progress.brandProfile.anthropicApiKey);
        const anthropic = createAnthropic({ apiKey });

        const body = await req.json();
        const { instruction = "Generate website copy for all sections" } = body;

        const systemContext = await buildSystemPrompt(workspaceId);

        const systemPrompt = `${systemContext}

You are helping this creator build their public-facing website. You know their brand deeply from the context above.

Your job is to generate website copy suggestions. Respond ONLY with a valid JSON object in this exact format:
{
  "heroHeadline": "short all-caps headline (1-4 words, like THE MICHALAKS)",
  "heroTagline": "one sentence describing what they do and what makes them unique",
  "heroSubtext": "2-3 sentences for the hero section bio (engaging, third-person)",
  "aboutText": "2-3 paragraph about section text (first-person, warm and authentic)",
  "servicesHeadline": "short headline for the services/what we offer section",
  "statsHeadline": "short headline for the audience/platform stats section",
  "workHeadline": "short headline for the featured work section",
  "testimonialsHeadline": "short headline for testimonials section",
  "seoTitle": "SEO page title (50-60 chars)",
  "seoDescription": "SEO meta description (150-160 chars)",
  "sectionOrder": ["hero", "about", "stats", "work", "testimonials", "services", "partners", "contact"],
  "themeRecommendation": {
    "note": "brief explanation of why these colours suit the brand"
  }
}

Be specific, use their actual brand name, real stats where available, and write in a voice that matches their bio and tone.`;

        const result = streamText({
            model: anthropic("claude-sonnet-4-5-20250929"),
            system: systemPrompt,
            messages: [{ role: "user", content: instruction }],
            maxOutputTokens: 1500,
        });

        return result.toTextStreamResponse();
    } catch (error: unknown) {
        const err = error as { status?: number };
        console.error("AI website suggestions error:", error);
        if (err.status === 401) {
            return NextResponse.json({ error: "API key invalid. Update it in Settings → AI." }, { status: 422 });
        }
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }
}
