/**
 * POST /api/ai/generate-contract
 *
 * AI-generated contract template from campaign details.
 * Uses the workspace's BYOK Anthropic key + campaign/brand data
 * to produce a professional influencer marketing agreement.
 *
 * Body: { campaignId, additionalTerms? }
 * Returns: { contract, campaignName, brandName }
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

export async function POST(req: Request) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get BYOK key + creator profile
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
        const { campaignId, additionalTerms } = body;

        if (!campaignId) {
            return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
        }

        // Fetch campaign + brand
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, workspaceId },
            include: {
                brand: true,
                deliverables: true,
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Build the contract generation prompt
        const systemPrompt = `You are an expert contract drafting assistant for influencer marketing.
You generate professional, clear, and fair contract templates in markdown format.

Guidelines:
- Use proper legal language but keep it readable
- Include all standard influencer marketing contract sections
- Use the specific details provided (dates, fees, deliverables, etc.)
- Where details are missing, include placeholder brackets like [TO BE AGREED]
- Include usage rights, exclusivity, payment terms, revision policies
- Add standard clauses: confidentiality, termination, force majeure, governing law
- Format as clean markdown with headers and bullet points
- Currency should match the workspace's currency setting

The contract should be comprehensive enough to use as a real starting point,
but clearly marked as a TEMPLATE/DRAFT that should be reviewed by a legal professional.`;

        const contextParts: string[] = [];

        // Creator / Service Provider details
        contextParts.push(`=== SERVICE PROVIDER (CREATOR) ===
Name: ${profile.businessName || profile.brandName}
${profile.businessAddress ? `Address: ${profile.businessAddress}` : "Address: [CREATOR ADDRESS]"}
${profile.contactEmail ? `Email: ${profile.contactEmail}` : ""}
${profile.vatNumber ? `VAT/Tax Number: ${profile.vatNumber}` : ""}
Currency: ${profile.currency || "GBP"}
${profile.paymentTerms ? `Default Payment Terms: ${profile.paymentTerms}` : ""}`);

        // Client / Brand details
        contextParts.push(`=== CLIENT (BRAND) ===
Company: ${campaign.brand.name}
${campaign.brand.contactName ? `Contact: ${campaign.brand.contactName}` : "Contact: [BRAND CONTACT]"}
${campaign.brand.contactTitle ? `Title: ${campaign.brand.contactTitle}` : ""}
${campaign.brand.contactEmail ? `Email: ${campaign.brand.contactEmail}` : "Email: [BRAND EMAIL]"}
${campaign.brand.website ? `Website: ${campaign.brand.website}` : ""}`);

        // Campaign details
        contextParts.push(`=== CAMPAIGN DETAILS ===
Campaign Name: ${campaign.name}
${campaign.brief ? `Brief: ${campaign.brief}` : ""}
${campaign.fee ? `Fee: ${profile.currency || "GBP"} ${campaign.fee.toLocaleString()}` : "Fee: [TO BE AGREED]"}
${campaign.startDate ? `Start Date: ${new Date(campaign.startDate).toLocaleDateString("en-GB")}` : "Start: [TO BE AGREED]"}
${campaign.endDate ? `End Date: ${new Date(campaign.endDate).toLocaleDateString("en-GB")}` : "End: [TO BE AGREED]"}
${campaign.paymentTerms ? `Payment Terms: ${campaign.paymentTerms}` : `Payment Terms: ${profile.paymentTerms || "net-30"}`}
${campaign.usageRights ? `Usage Rights: ${campaign.usageRights}` : "Usage Rights: [TO BE AGREED]"}
${campaign.exclusivity ? `Exclusivity: ${campaign.exclusivity}` : "Exclusivity: [TO BE AGREED]"}
${campaign.revisionPolicy ? `Revision Policy: ${campaign.revisionPolicy}` : ""}`);

        // Deliverables
        if (campaign.deliverables.length > 0) {
            const delLines = campaign.deliverables.map(
                (d) =>
                    `- ${d.type} on ${d.platform}${d.description ? `: ${d.description}` : ""}${d.dueDate ? ` (due: ${new Date(d.dueDate).toLocaleDateString("en-GB")})` : ""}`
            );
            contextParts.push(`=== DELIVERABLES ===\n${delLines.join("\n")}`);
        } else {
            contextParts.push(`=== DELIVERABLES ===\n[DELIVERABLES TO BE SPECIFIED]`);
        }

        if (additionalTerms) {
            contextParts.push(`=== ADDITIONAL TERMS REQUESTED ===\n${additionalTerms}`);
        }

        const userMessage = `Generate a professional influencer marketing contract using these details:\n\n${contextParts.join("\n\n")}`;

        const result = await generateText({
            model: anthropic("claude-sonnet-4-5-20250929"),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            maxOutputTokens: 4096,
        });

        return NextResponse.json({
            contract: result.text,
            campaignName: campaign.name,
            brandName: campaign.brand.name,
        });
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error("Contract generation error:", error);

        if (err.status === 401) {
            return NextResponse.json(
                { error: "Your API key is no longer valid. Update it in Settings → AI Manager." },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: "Failed to generate contract. Please try again." },
            { status: 500 }
        );
    }
}
