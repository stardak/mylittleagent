import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getAnthropicClient, formatAiError } from "@/lib/anthropic";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get workspace
        const membership = await prisma.membership.findFirst({
            where: { userId: session.user.id },
        });
        if (!membership) {
            return NextResponse.json({ error: "No workspace found" }, { status: 404 });
        }

        const workspaceId = membership.workspaceId;

        // Get AI client
        const anthropic = await getAnthropicClient(workspaceId);
        if (!anthropic) {
            return NextResponse.json(
                { error: "No API key configured. Add one in Settings → AI." },
                { status: 400 }
            );
        }

        // Fetch campaign with all related data
        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                brand: true,
                deliverables: true,
            },
        });

        if (!campaign || campaign.workspaceId !== workspaceId) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Fetch creator profile
        const brandProfile = await prisma.brandProfile.findUnique({
            where: { workspaceId },
        });

        // Fetch platforms for context
        const platforms = await prisma.platform.findMany({
            where: { workspaceId },
        });

        // Build the deliverables description
        const deliverablesText = campaign.deliverables.length > 0
            ? campaign.deliverables.map((d, i) => {
                const parts = [`${i + 1}. ${d.type} on ${d.platform}`];
                if (d.description) parts.push(`   Description: ${d.description}`);
                if (d.dueDate) parts.push(`   Due: ${new Date(d.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
                if (d.publishDate) parts.push(`   Publish: ${new Date(d.publishDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
                if (d.liveUrl) parts.push(`   URL: ${d.liveUrl}`);
                return parts.join("\n");
            }).join("\n\n")
            : "No deliverables defined yet.";

        // Build platforms context
        const platformsText = platforms.map(p =>
            `${p.displayName || p.type}: ${p.handle || "N/A"} (${p.followers?.toLocaleString() || "N/A"} followers)`
        ).join("\n");

        const systemPrompt = `You are a professional talent manager creating a Brand Partnership Brief document.

Use this EXACT structure (based on the standard Gleam Futures brief format). Output valid JSON matching the schema below.

The brief should be professional, comprehensive, and protect the creator's interests while being fair to the brand.

JSON Schema:
{
  "talentContact": { "name": string, "email": string },
  "brandContact": { "name": string, "email": string },
  "agencyContact": { "name": string, "email": string } | null,
  "brand": string,
  "agency": string | null,
  "talent": string,
  "campaign": string,
  "fee": { "amount": string, "paymentSchedule": string },
  "expenses": string,
  "deliverables": [{ "platform": string, "type": string, "description": string, "publishDate": string | null, "publishUrl": string | null, "duration": string }],
  "keyMessages": { "hashtags": string[], "handles": string[], "messages": string[] },
  "dosAndDonts": { "dos": string[], "donts": string[] },
  "creativeControl": string[],
  "paidPromotion": string,
  "services": string | null,
  "exclusivity": string,
  "usageRights": string,
  "additionalNotes": string[]
}

Fill in realistic, professional details based on the campaign data provided. For any fields where you don't have explicit data, use sensible defaults that protect the talent's interests (e.g., "Talent to have full creative control", "No paid media promotion unless separately agreed", "1 round of feedback permitted").

IMPORTANT: Return ONLY valid JSON, no markdown, no code fences.`;

        const userPrompt = `Generate a Brand Partnership Brief for this campaign:

CAMPAIGN: ${campaign.name}
BRIEF/DESCRIPTION: ${campaign.brief || "Not specified"}
STATUS: ${campaign.status}

BRAND:
- Name: ${campaign.brand?.name || "Unknown"}
- Industry: ${campaign.brand?.industry || "Not specified"}

TALENT/CREATOR:
- Brand Name: ${brandProfile?.brandName || "Creator"}
- Contact Email: ${brandProfile?.contactEmail || "Not specified"}
- Location: ${brandProfile?.location || "Not specified"}
- Website: ${brandProfile?.website || "Not specified"}

PLATFORMS:
${platformsText || "No platforms configured"}

FEE: ${campaign.fee ? `£${campaign.fee.toLocaleString()}` : "Not specified"}
PAYMENT TERMS: ${campaign.paymentTerms || "Not specified"}
USAGE RIGHTS: ${campaign.usageRights || "Not specified"}
EXCLUSIVITY: ${campaign.exclusivity || "No commercial exclusivity"}
REVISION POLICY: ${campaign.revisionPolicy || "Not specified"}

DATES:
- Start: ${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("en-GB") : "TBC"}
- End: ${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("en-GB") : "TBC"}

DELIVERABLES:
${deliverablesText}

Generate the complete brief JSON now.`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4000,
            messages: [{ role: "user", content: userPrompt }],
            system: systemPrompt,
        });

        // Extract text content
        const textBlock = response.content.find((block) => block.type === "text");
        if (!textBlock || textBlock.type !== "text") {
            return NextResponse.json({ error: "AI returned no content" }, { status: 500 });
        }

        // Parse JSON response
        let briefData;
        try {
            briefData = JSON.parse(textBlock.text);
        } catch {
            // Try to extract JSON from markdown code fences if present
            const jsonMatch = textBlock.text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                briefData = JSON.parse(jsonMatch[1].trim());
            } else {
                console.error("AI response was not valid JSON:", textBlock.text.substring(0, 200));
                return NextResponse.json({ error: "Failed to parse brief from AI response" }, { status: 500 });
            }
        }

        // Save to campaign
        const updated = await prisma.campaign.update({
            where: { id },
            data: {
                briefDocument: briefData,
                briefGeneratedAt: new Date(),
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            include: {
                brand: true,
                deliverables: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error: unknown) {
        console.error("Brief generation error:", error);

        // Check if it's an Anthropic API error (has status property)
        const err = error as { status?: number; message?: string; name?: string };
        if (err.status) {
            const aiError = formatAiError(error);
            return NextResponse.json(
                { error: aiError.message },
                { status: 500 }
            );
        }

        // For other errors (Prisma, parsing, etc.), return the actual message
        return NextResponse.json(
            { error: err.message || "An unexpected error occurred while generating the brief." },
            { status: 500 }
        );
    }
}
