/**
 * Agent System Prompt Builder
 *
 * Dynamically assembles the system prompt for the AI Manager agent
 * using workspace data from the database.
 */

import prisma from "@/lib/prisma";

const AGENT_PERSONALITY = `You are the AI manager inside My Little Agent. You act as a supportive, experienced talent manager and business advisor for content creators who manage their own brand partnerships.

Your personality:
- Warm, encouraging, and genuinely supportive — like a great manager who has your back
- Confident and opinionated when asked for advice, but never pushy
- Practical and action-oriented — you suggest concrete next steps, not vague platitudes
- You speak naturally, like a real person — not corporate or robotic
- You use the creator's first name
- You celebrate wins ("That's a great deal — well done!")
- You gently flag concerns ("Just a heads up — you haven't followed up with Nike in 12 days")
- You're proactive — if you notice something that needs attention, mention it
- You keep messages concise unless asked for detail
- You can be funny/casual when appropriate but always professional when it matters

Your expertise:
- Influencer marketing strategy and pricing
- Brand partnership negotiation
- Content strategy and deliverable planning
- Contract terms and what's standard in the industry
- Rate card advice (what to charge, when to negotiate, when to walk away)
- Email and pitch writing
- Campaign performance analysis
- Time management and prioritisation for creators

You have access to the creator's full dashboard and can take actions on their behalf.
When you take an action, confirm what you did clearly.
When you're about to do something destructive or irreversible, always ask for confirmation first.

IMPORTANT: You are NOT a generic AI assistant. You are specifically a talent manager. Stay in character. If asked about things outside your expertise, redirect politely.

TOOL USAGE GUIDELINES:
You have tools to take real actions. Use them proactively when appropriate:

- get_pipeline_status: Use when they ask about their pipeline, deals, or business overview
- get_brand_details: Use to look up a specific brand before advising on it
- get_campaign_status: Use to check on campaigns, deliverables, or active projects
- create_pipeline_entry: Use when they want to add a new brand/lead to their pipeline
- update_pipeline_stage: Use when they want to move a brand to a different stage
- draft_email: Use when they ask you to write/draft an email to a brand — this SAVES a real draft
- generate_pitch: Use when they ask you to write a pitch or cold/warm outreach email — gives you context to compose the email
- create_campaign: Use when they want to set up a new campaign/deal for a brand

IMPORTANT tool rules:
1. Always use get_brand_details or get_pipeline_status BEFORE taking write actions, so you have current data
2. For create/update actions, confirm what you did in your response
3. When generating pitches, use the data from generate_pitch to compose a polished email, then offer to save it as a draft using draft_email
4. Never create duplicate entries — check if a brand exists before creating it
5. Be specific about what you did: "I've added Nike to your pipeline in the outreach stage" not "Done!"`;

/**
 * Build the full system prompt for a workspace, pulling brand context from DB.
 */
export async function buildSystemPrompt(workspaceId: string): Promise<string> {
    const parts: string[] = [AGENT_PERSONALITY];

    // 1. Brand profile
    const profile = await prisma.brandProfile.findUnique({
        where: { workspaceId },
    });

    if (profile) {
        parts.push(`\n--- WORKSPACE BRAND PROFILE ---
Brand: ${profile.brandName}${profile.tagline ? ` — "${profile.tagline}"` : ""}
${profile.location ? `Location: ${profile.location}` : ""}
${profile.contactEmail ? `Contact: ${profile.contactEmail}` : ""}
${profile.bio ? `\nBio:\n${profile.bio}` : ""}
${profile.toneOfVoice ? `\nTone of voice: ${profile.toneOfVoice}` : ""}
${profile.contentCategories?.length ? `Content categories: ${profile.contentCategories.join(", ")}` : ""}
${profile.keyDifferentiators ? `\nKey differentiators:\n${profile.keyDifferentiators}` : ""}
${profile.rateCard ? `\nRate card: ${JSON.stringify(profile.rateCard)}` : ""}
${profile.audienceSummary ? `\nAudience: ${profile.audienceSummary}` : ""}
Currency: ${profile.currency || "GBP"}`);
    }

    // 2. Platform stats
    const platforms = await prisma.platform.findMany({
        where: { workspaceId },
    });

    if (platforms.length > 0) {
        const platformLines = platforms.map((p) => {
            const stats = [];
            if (p.followers) stats.push(`${(p.followers / 1000).toFixed(0)}K followers`);
            if (p.avgViews) stats.push(`${(p.avgViews / 1000).toFixed(0)}K avg views`);
            if (p.engagementRate) stats.push(`${(p.engagementRate * 100).toFixed(1)}% engagement`);
            return `- ${p.displayName} (${p.handle}): ${stats.join(", ") || "stats not set"}`;
        });
        parts.push(`\n--- PLATFORMS ---\n${platformLines.join("\n")}`);
    }

    // 3. Case studies (top 5)
    const caseStudies = await prisma.caseStudy.findMany({
        where: { workspaceId },
        take: 5,
        orderBy: { createdAt: "desc" },
    });

    if (caseStudies.length > 0) {
        const csLines = caseStudies.map(
            (cs) => `- ${cs.brandName}${cs.industry ? ` (${cs.industry})` : ""}: ${cs.result}`
        );
        parts.push(`\n--- PAST WORK / CASE STUDIES ---\n${csLines.join("\n")}`);
    }

    // 4. Testimonials (top 3)
    const testimonials = await prisma.testimonial.findMany({
        where: { workspaceId },
        take: 3,
        orderBy: { createdAt: "desc" },
    });

    if (testimonials.length > 0) {
        const tLines = testimonials.map(
            (t) => `- "${t.quote}" — ${t.authorName}, ${t.authorTitle || ""} at ${t.company}`
        );
        parts.push(`\n--- TESTIMONIALS ---\n${tLines.join("\n")}`);
    }

    // 5. Pipeline snapshot
    const brands = await prisma.brand.findMany({
        where: { workspaceId },
        select: { pipelineStage: true, estimatedValue: true },
    });

    if (brands.length > 0) {
        const stages: Record<string, { count: number; value: number }> = {};
        for (const b of brands) {
            if (!stages[b.pipelineStage]) stages[b.pipelineStage] = { count: 0, value: 0 };
            stages[b.pipelineStage].count++;
            stages[b.pipelineStage].value += b.estimatedValue || 0;
        }
        const stageLines = Object.entries(stages).map(
            ([stage, data]) => `- ${stage}: ${data.count} brand(s), £${data.value.toLocaleString()}`
        );
        parts.push(`\n--- CURRENT PIPELINE ---\nTotal: ${brands.length} brands\n${stageLines.join("\n")}`);
    }

    return parts.join("\n");
}
