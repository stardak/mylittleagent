/**
 * POST /api/ai/generate-pitch
 *
 * Standalone pitch generation endpoint. Uses the workspace's BYOK
 * Anthropic key + full brand context to generate a personalised
 * outreach email.
 *
 * Body: { brandId, pitchType, additionalContext? }
 * Returns: { subject, body, pitchType }
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

const PITCH_TYPE_INSTRUCTIONS: Record<string, string> = {
    cold: `This is a COLD pitch — the creator has never spoken to this brand before.
Be professional but warm. Lead with value — what the creator can do for the brand.
Reference specific stats and past work. Keep it concise (under 200 words).
Don't be salesy or desperate. Be confident.`,

    warm: `This is a WARM pitch — there's been some prior contact or mutual connection.
Reference the existing relationship/connection naturally. Be conversational.
Focus on a specific collaboration idea. Include relevant stats but don't overload.`,

    follow_up: `This is a FOLLOW-UP email — continuing a previous conversation.
Be brief and to the point. Reference the previous conversation.
Add value (new content, updated stats, new idea). Include a clear call to action.
Keep it under 100 words.`,

    inbound_response: `This is a RESPONSE TO AN INBOUND INQUIRY — the brand reached out first.
Be enthusiastic but professional. Show you've done your homework on the brand.
Suggest next steps (call, rate card, creative brief). Be responsive and helpful.`,
};

export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        const body = await req.json();
        const { brandId, pitchType = "cold", additionalContext } = body;

        if (!brandId) {
            return NextResponse.json({ error: "brandId is required" }, { status: 400 });
        }

        const validTypes = ["cold", "warm", "follow_up", "inbound_response"];
        if (!validTypes.includes(pitchType)) {
            return NextResponse.json(
                { error: `pitchType must be one of: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        // Fetch brand
        const brand = await prisma.brand.findFirst({
            where: { id: brandId, workspaceId },
        });

        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        // Fetch creator context
        const platforms = await prisma.platform.findMany({
            where: { workspaceId },
        });

        const caseStudies = await prisma.caseStudy.findMany({
            where: { workspaceId },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        // Build the prompt
        const systemPrompt = `You are an expert email copywriter specialising in influencer/creator outreach.
You write emails that feel personal, specific, and human — never generic or template-like.

${PITCH_TYPE_INSTRUCTIONS[pitchType]}

You MUST respond in valid JSON with exactly two fields:
{
  "subject": "The email subject line",
  "body": "The full email body"
}

Do NOT include any text outside the JSON. Do NOT use markdown code fences.`;

        const contextParts: string[] = [];

        // Creator profile
        contextParts.push(`=== CREATOR PROFILE ===
Name: ${profile.brandName}
${profile.tagline ? `Tagline: ${profile.tagline}` : ""}
${profile.bio ? `Bio: ${profile.bio}` : ""}
${profile.toneOfVoice ? `Tone: ${profile.toneOfVoice}` : ""}
${profile.contentCategories?.length ? `Categories: ${profile.contentCategories.join(", ")}` : ""}
${profile.keyDifferentiators ? `Differentiators: ${profile.keyDifferentiators}` : ""}
${profile.audienceSummary ? `Audience: ${profile.audienceSummary}` : ""}`);

        // Platforms
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

        // Past work
        if (caseStudies.length > 0) {
            const csLines = caseStudies.map(
                (cs) => `- ${cs.brandName} (${cs.industry || "N/A"}): ${cs.result}`
            );
            contextParts.push(`=== PAST BRAND WORK ===\n${csLines.join("\n")}`);
        }

        // Rate card
        if (profile.rateCard) {
            contextParts.push(`=== RATE CARD ===\n${JSON.stringify(profile.rateCard)}`);
        }

        // Target brand
        contextParts.push(`=== TARGET BRAND ===
Brand: ${brand.name}
${brand.industry ? `Industry: ${brand.industry}` : ""}
${brand.contactName ? `Contact: ${brand.contactName}` : ""}
${brand.contactTitle ? `Title: ${brand.contactTitle}` : ""}
${brand.website ? `Website: ${brand.website}` : ""}
${brand.notes ? `Notes: ${brand.notes}` : ""}`);

        if (additionalContext) {
            contextParts.push(`=== ADDITIONAL CONTEXT ===\n${additionalContext}`);
        }

        const userMessage = `Generate a ${pitchType.replace("_", " ")} pitch email using this context:\n\n${contextParts.join("\n\n")}`;

        const result = await generateText({
            model: anthropic("claude-sonnet-4-5-20250929"),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            maxOutputTokens: 1500,
        });

        // Parse the JSON response
        try {
            const parsed = JSON.parse(result.text);
            return NextResponse.json({
                subject: parsed.subject,
                body: parsed.body,
                pitchType,
                brandName: brand.name,
            });
        } catch {
            // If JSON parsing fails, try to extract subject and body
            return NextResponse.json({
                subject: `Partnership Opportunity — ${profile.brandName} × ${brand.name}`,
                body: result.text,
                pitchType,
                brandName: brand.name,
                warning: "Response was not structured JSON — returned raw text as body",
            });
        }
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error("Pitch generation error:", error);

        if (err.status === 401) {
            return NextResponse.json(
                { error: "Your API key is no longer valid. Update it in Settings → AI Manager." },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: "Failed to generate pitch. Please try again." },
            { status: 500 }
        );
    }
}
