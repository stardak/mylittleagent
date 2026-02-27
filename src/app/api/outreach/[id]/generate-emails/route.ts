/**
 * POST /api/outreach/:id/generate-emails
 *
 * AI-generate initial outreach email + follow-up email using
 * the brand brief, creator profile, and platform stats.
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

        // Fetch the outreach record
        const outreach = await prisma.outreach.findFirst({
            where: { id, workspaceId },
        });

        if (!outreach) {
            return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
        }

        // Get workspace slug for media card link
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { slug: true },
        });

        // Fetch creator context
        const platforms = await prisma.platform.findMany({ where: { workspaceId } });
        const caseStudies = await prisma.caseStudy.findMany({
            where: { workspaceId },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        // Build context
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
                (cs) => `- ${cs.brandName} (${cs.industry || "N/A"}): ${cs.result}`
            );
            contextParts.push(`=== PAST BRAND WORK ===\n${csLines.join("\n")}`);
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
                    // Strip HTML to plain text
                    websiteContent = html
                        .replace(/<script[\s\S]*?<\/script>/gi, "")
                        .replace(/<style[\s\S]*?<\/style>/gi, "")
                        .replace(/<[^>]+>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 2000);
                }
            } catch {
                // Silently fail — website context is optional
            }
        }

        contextParts.push(`=== TARGET BRAND ===
Brand: ${outreach.brandName}
${outreach.brandIndustry ? `Industry: ${outreach.brandIndustry}` : ""}
${outreach.brandUrl ? `Website: ${outreach.brandUrl}` : ""}
Contact Email: ${outreach.contactEmail}
Product/Service: ${outreach.product}`);

        // ── Collab angle — most important personalisation signal ──────────────
        if (outreach.fitReason) {
            contextParts.push(`=== WHY THIS COLLAB WOULD WORK (CRITICAL — use this to personalise Email 1) ===
${outreach.fitReason}

IMPORTANT: this note is the creator's own words about why this partnership makes sense. Let it shape the opening and angle of the email. For example:
- If they mention working together before → warmly reference the previous collaboration and build on that history
- If they mention being a genuine fan/user of the product → make that authentic love the hook of the email, not stats
- If they mention audience alignment → weave in the specific data point that supports it
Never include this section verbatim — instead let it naturally inform the tone and angle of the email.`);
        }

        if (outreach.includeMediaCard && workspace?.slug) {
            contextParts.push(`=== MEDIA CARD LINK ===\nThe creator wants to include a link to their public media card in the email. Use this exact URL: ${process.env.NEXTAUTH_URL || "https://app.mylittleagent.com"}/${workspace.slug}/mediacard`);
        }

        if (websiteContent) {
            contextParts.push(`=== BRAND WEBSITE CONTENT ===\n${websiteContent}`);
        }

        const systemPrompt = `You are an expert email copywriter specialising in influencer/creator brand outreach.
You write emails that feel personal, specific, and human — never generic or template-like.
You adapt your tone based on the creator's niche and the brand's industry.

You need to generate TWO emails:

EMAIL 1 (Initial Outreach):
- Professional but personable introduction of the creator
- Express genuine interest in collaborating with this specific brand
- Mention specific products/services they want to promote
- Reference relevant stats, audience alignment, and past work
- Include a mention of their media card (the creator will add the actual link)
- Brief, authentic, not salesy — under 200 words for the body

EMAIL 2 (Follow-Up — sent 7 days later if no reply):
- Friendly follow-up referencing the original email
- Brief and low-pressure
- Maybe add one new piece of value (recent content stat, new idea)
- Under 100 words for the body

You MUST respond in valid JSON with exactly this structure:
{
  "email1": { "subject": "...", "body": "..." },
  "email2": { "subject": "...", "body": "..." }
}

Do NOT include any text outside the JSON. Do NOT use markdown code fences.`;

        const userMessage = `Generate the two outreach emails using this context:\n\n${contextParts.join("\n\n")}`;

        const result = await generateText({
            model: anthropic("claude-sonnet-4-5-20250929"),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            maxOutputTokens: 2000,
        });

        try {
            // Strip markdown code fences Claude sometimes adds despite instructions
            const raw = result.text
                .trim()
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```\s*$/i, "")
                .trim();
            const parsed = JSON.parse(raw);

            // Save the generated emails to the outreach record
            await prisma.outreach.update({
                where: { id },
                data: {
                    email1Subject: parsed.email1.subject,
                    email1Body: parsed.email1.body,
                    email2Subject: parsed.email2.subject,
                    email2Body: parsed.email2.body,
                },
            });

            return NextResponse.json({
                email1: parsed.email1,
                email2: parsed.email2,
            });
        } catch {
            return NextResponse.json(
                { error: "AI returned invalid response. Please try again." },
                { status: 500 }
            );
        }
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error("Email generation error:", error);

        if (err.status === 401) {
            return NextResponse.json(
                { error: "Your API key is no longer valid. Update it in Settings → AI Manager." },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: "Failed to generate emails. Please try again." },
            { status: 500 }
        );
    }
}
