/**
 * POST /api/ai/improve
 *
 * Uses the workspace's BYOK Anthropic key to improve/enhance text
 * during onboarding. Lightweight prompts to keep costs minimal.
 *
 * Body: { text: string, fieldType: string, context?: string }
 * Returns: { improved: string }
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

const FIELD_PROMPTS: Record<string, string> = {
    bio: `You are improving a creator/influencer's bio for their professional media card. 
Make it compelling, concise, and professional. Highlight what makes them unique.
Keep the same factual information but make the writing sharper and more engaging.
Aim for 2-3 sentences max. Write in third person.`,

    tagline: `You are improving a creator's tagline — a short one-liner that appears on their media card.
Make it punchy, memorable, and professional. Keep it under 10 words.
It should capture their unique value proposition.`,

    brief: `You are improving a case study brief description for a creator's portfolio.
Make it clear, concise, and professional. Highlight what the collaboration involved.
Keep it to 1-2 sentences. Focus on the scope and nature of the work.`,

    result: `You are improving a case study result description for a creator's portfolio.
Make it impactful and data-driven where possible. Highlight measurable outcomes.
Keep it to 1-2 sentences. Use specific numbers and achievements.`,

    audienceSummary: `You are improving an audience demographics summary for a creator's media card.
Make it clear, data-rich, and useful for brand decision-makers.
Include key stats like age ranges, gender split, geographic distribution, and interests.
Keep it to 2-3 sentences.`,

    fitReason: `You are improving a creator's explanation of why they're a great fit for a specific brand.
Make it persuasive, specific, and professional. Highlight audience alignment, content style fit, and genuine enthusiasm.
Keep it to 2-3 sentences. Focus on what makes this collaboration mutually beneficial.`,

    emailSignature: `You are improving a professional email signature for a content creator.
Keep it clean, professional, and not too long.
Include name, brand, handles, and website. Use a professional sign-off.`,

    generic: `You are improving text for a content creator's professional profile.
Make the writing clearer, more professional, and more engaging.
Keep the same meaning and factual information but improve the quality.`,
};

export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await prisma.brandProfile.findUnique({
            where: { workspaceId },
            select: { anthropicApiKey: true, brandName: true },
        });

        if (!profile?.anthropicApiKey) {
            return NextResponse.json(
                { error: "No API key configured. Set up your AI Manager first." },
                { status: 422 }
            );
        }

        const apiKey = decryptApiKey(profile.anthropicApiKey);
        const anthropic = createAnthropic({ apiKey });

        const body = await req.json();
        const { text, fieldType = "generic", context } = body;

        if (!text || text.trim().length < 3) {
            return NextResponse.json(
                { error: "Please enter some text first, then use AI to improve it." },
                { status: 400 }
            );
        }

        const systemPrompt = FIELD_PROMPTS[fieldType] || FIELD_PROMPTS.generic;

        let userMessage = `Improve this text:\n\n"${text}"`;
        if (context) {
            userMessage += `\n\nAdditional context: ${context}`;
        }
        if (profile.brandName) {
            userMessage += `\n\nThe creator's brand name is: ${profile.brandName}`;
        }

        userMessage += `\n\nRespond with ONLY the improved text. No explanations, no quotes, no preamble.`;

        const result = await generateText({
            model: anthropic("claude-sonnet-4-5-20250929"),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            maxOutputTokens: 500,
        });

        return NextResponse.json({ improved: result.text.trim() });
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error("AI improve error:", error);

        if (err.status === 401) {
            return NextResponse.json(
                { error: "Your API key is no longer valid. Update it in Settings → AI Manager." },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: "Failed to improve text. Please try again." },
            { status: 500 }
        );
    }
}
