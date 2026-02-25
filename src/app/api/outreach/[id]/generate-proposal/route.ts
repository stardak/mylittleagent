/**
 * POST /api/outreach/:id/generate-proposal
 *
 * AI-generate a tailored pitch proposal for a brand that has replied.
 * Includes collaboration concept, deliverables, audience stats,
 * past work, and proposed timeline.
 */

import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";

async function getWorkspaceId() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });
    return membership?.workspaceId ?? null;
}

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get BYOK key
        const profile = await prisma.brandProfile.findUnique({
            where: { workspaceId },
        });

        if (!profile?.anthropicApiKey) {
            return NextResponse.json(
                { error: "No API key configured. Add your Anthropic API key in Settings → AI Manager." },
                { status: 422 }
            );
        }

        const apiKey = decryptApiKey(profile.anthropicApiKey);
        const anthropic = createAnthropic({ apiKey });

        const outreach = await prisma.outreach.findFirst({
            where: { id, workspaceId },
        });

        if (!outreach) {
            return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
        }

        // Fetch creator context
        const platforms = await prisma.platform.findMany({ where: { workspaceId } });
        const caseStudies = await prisma.caseStudy.findMany({
            where: { workspaceId },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        const contextParts: string[] = [];

        contextParts.push(`=== CREATOR PROFILE ===
Name: ${profile.brandName}
${profile.tagline ? `Tagline: ${profile.tagline}` : ""}
${profile.bio ? `Bio: ${profile.bio}` : ""}
${profile.toneOfVoice ? `Tone: ${profile.toneOfVoice}` : ""}
${profile.contentCategories?.length ? `Categories: ${profile.contentCategories.join(", ")}` : ""}
${profile.keyDifferentiators ? `Differentiators: ${profile.keyDifferentiators}` : ""}
${profile.audienceSummary ? `Audience: ${profile.audienceSummary}` : ""}`);

        if (platforms.length > 0) {
            const platLines = platforms.map((p) => {
                const stats = [];
                if (p.followers) stats.push(`${(p.followers / 1000).toFixed(0)}K followers`);
                if (p.avgViews) stats.push(`${(p.avgViews / 1000).toFixed(0)}K avg views`);
                if (p.engagementRate) stats.push(`${(p.engagementRate * 100).toFixed(1)}% engagement`);
                return `- ${p.displayName} (${p.handle}): ${stats.join(", ")}`;
            });
            contextParts.push(`=== PLATFORMS ===\n${platLines.join("\n")}`);
        }

        if (caseStudies.length > 0) {
            const csLines = caseStudies.map(
                (cs) => `- ${cs.brandName} (${cs.industry || "N/A"}): ${cs.result}${cs.description ? ` — ${cs.description}` : ""}`
            );
            contextParts.push(`=== PAST BRAND WORK ===\n${csLines.join("\n")}`);
        }

        if (profile.rateCard) {
            contextParts.push(`=== RATE CARD ===\n${JSON.stringify(profile.rateCard)}`);
        }

        // Scrape brand website for context if URL provided
        let websiteContent = "";
        if (outreach.brandUrl) {
            try {
                const res = await fetch(outreach.brandUrl, {
                    headers: { "User-Agent": "Mozilla/5.0 (compatible; CreatorManager/1.0)" },
                    signal: AbortSignal.timeout(8000),
                });
                if (res.ok) {
                    const html = await res.text();
                    websiteContent = html
                        .replace(/<script[\s\S]*?<\/script>/gi, "")
                        .replace(/<style[\s\S]*?<\/style>/gi, "")
                        .replace(/<[^>]+>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 3000);
                }
            } catch {
                // Silently fail — website context is optional
            }
        }

        contextParts.push(`=== TARGET BRAND & OUTREACH CONTEXT ===
Brand: ${outreach.brandName}
${outreach.brandIndustry ? `Industry: ${outreach.brandIndustry}` : ""}
${outreach.brandUrl ? `Website: ${outreach.brandUrl}` : ""}
Product/Service: ${outreach.product}
${outreach.fitReason ? `Why I'm a good fit: ${outreach.fitReason}` : ""}
Contact: ${outreach.contactEmail}`);

        if (websiteContent) {
            contextParts.push(`=== BRAND WEBSITE CONTENT ===\n${websiteContent}`);
        }

        const systemPrompt = `You are an expert proposal writer for influencer/creator partnerships.
You create tailored, professional pitch proposals that help close brand deals.

Generate a structured pitch proposal with these sections:

1. COLLABORATION CONCEPT — A personalised creative concept specific to the brand's product/service
2. SUGGESTED DELIVERABLES — e.g. dedicated video, Instagram story series, TikTok integration, etc.
3. AUDIENCE STATS & DEMOGRAPHICS — pulled from the creator's platform data
4. PAST BRAND WORK — relevant examples of similar content or partnerships
5. PROPOSED TIMELINE — realistic milestones from agreement to content delivery
6. NEXT STEPS — clear call to action

You MUST respond in valid JSON with this structure:
{
  "title": "Proposal title",
  "summary": "One-paragraph executive summary",
  "collaborationConcept": "Detailed creative concept",
  "deliverables": [
    { "type": "Dedicated YouTube Video", "description": "...", "platform": "YouTube" },
    { "type": "Instagram Story Series", "description": "...", "platform": "Instagram" }
  ],
  "audienceStats": "Formatted audience stats paragraph",
  "pastWork": [
    { "brand": "Brand Name", "description": "What was done and results" }
  ],
  "timeline": [
    { "phase": "Week 1", "milestone": "Agreement & creative brief" },
    { "phase": "Week 2-3", "milestone": "Content production" }
  ],
  "nextSteps": "What happens next"
}

Do NOT include any text outside the JSON. Do NOT use markdown code fences.`;

        const userMessage = `Generate a pitch proposal using this context:\n\n${contextParts.join("\n\n")}`;

        const result = await generateText({
            model: anthropic("claude-sonnet-4-5-20250929"),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            maxOutputTokens: 3000,
        });

        try {
            const parsed = JSON.parse(result.text);

            // Save to outreach record
            await prisma.outreach.update({
                where: { id },
                data: { proposal: parsed },
            });

            return NextResponse.json({ proposal: parsed });
        } catch {
            return NextResponse.json(
                { error: "AI returned invalid response. Please try again." },
                { status: 500 }
            );
        }
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error("Proposal generation error:", error);

        if (err.status === 401) {
            return NextResponse.json(
                { error: "Your API key is no longer valid. Update it in Settings → AI Manager." },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: "Failed to generate proposal. Please try again." },
            { status: 500 }
        );
    }
}
