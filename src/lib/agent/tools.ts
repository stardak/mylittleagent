/**
 * Agent Tool Definitions
 *
 * Tools the AI Manager agent can invoke during conversation.
 * Each tool has a Zod v4 schema for input and an execute function
 * that performs real database operations scoped to the workspace.
 *
 * Uses AI SDK v6 `tool()` which expects `inputSchema` (not `parameters`).
 */

import { tool } from "ai";
import { z } from "zod/v4";
import prisma from "@/lib/prisma";

// Helper types from Prisma
type BrandSelect = {
    id: string;
    name: string;
    pipelineStage: string;
    estimatedValue: number | null;
    nextFollowUp: Date | null;
    nextAction: string | null;
    contactName: string | null;
    updatedAt: Date;
};

/**
 * Build all agent tools scoped to a workspace.
 * workspaceId is baked in at creation time — tools can never leak across tenants.
 */
export function makeAgentTools(workspaceId: string, userId?: string) {
    return {
        // ─── READ TOOLS ──────────────────────────────────────────────

        get_pipeline_status: tool({
            description:
                "Get a summary of the current brand pipeline — how many brands are in each stage and their total estimated value. Use this when the user asks about their pipeline, deals, or overall business status.",
            inputSchema: z.object({}),
            execute: async () => {
                const brands = await prisma.brand.findMany({
                    where: { workspaceId },
                    select: {
                        id: true,
                        name: true,
                        pipelineStage: true,
                        estimatedValue: true,
                        nextFollowUp: true,
                        nextAction: true,
                        contactName: true,
                        updatedAt: true,
                    },
                    orderBy: { updatedAt: "desc" },
                });

                const stages: Record<string, { count: number; value: number; brands: string[] }> = {};
                let totalValue = 0;
                const overdue: { name: string; followUp: Date }[] = [];

                for (const b of brands as BrandSelect[]) {
                    if (!stages[b.pipelineStage]) {
                        stages[b.pipelineStage] = { count: 0, value: 0, brands: [] };
                    }
                    stages[b.pipelineStage].count++;
                    stages[b.pipelineStage].value += b.estimatedValue || 0;
                    stages[b.pipelineStage].brands.push(b.name);
                    totalValue += b.estimatedValue || 0;

                    if (b.nextFollowUp && new Date(b.nextFollowUp) < new Date()) {
                        overdue.push({ name: b.name, followUp: b.nextFollowUp });
                    }
                }

                return {
                    totalBrands: brands.length,
                    totalPipelineValue: totalValue,
                    stages,
                    overdueFollowUps: overdue,
                };
            },
        }),

        get_brand_details: tool({
            description:
                "Look up a specific brand by name or ID. Returns full details including contact info, campaigns, recent emails, and activity. Use when the user asks about a specific brand.",
            inputSchema: z.object({
                brandName: z
                    .string()
                    .optional()
                    .describe("Brand name to search for (case-insensitive partial match)"),
                brandId: z.string().optional().describe("Exact brand ID if known"),
            }),
            execute: async ({ brandName, brandId }: { brandName?: string; brandId?: string }) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const where: any = { workspaceId };

                if (brandId) {
                    where.id = brandId;
                } else if (brandName) {
                    where.name = { contains: brandName, mode: "insensitive" };
                } else {
                    return { error: "Please provide a brand name or ID" };
                }

                const brand = await prisma.brand.findFirst({
                    where,
                    include: {
                        campaigns: {
                            orderBy: { createdAt: "desc" },
                            take: 5,
                            select: {
                                id: true,
                                name: true,
                                status: true,
                                fee: true,
                                startDate: true,
                                endDate: true,
                            },
                        },
                        emails: {
                            orderBy: { createdAt: "desc" },
                            take: 5,
                            select: {
                                id: true,
                                subject: true,
                                status: true,
                                direction: true,
                                sentAt: true,
                            },
                        },
                        _count: { select: { campaigns: true, emails: true, activities: true } },
                    },
                });

                if (!brand) {
                    return { error: `No brand found matching "${brandName || brandId}"` };
                }

                return brand;
            },
        }),

        get_campaign_status: tool({
            description:
                "Check campaign details including deliverables, status, fees, and dates. Use when the user asks about a specific campaign or wants a campaign overview.",
            inputSchema: z.object({
                campaignName: z
                    .string()
                    .optional()
                    .describe("Campaign name to search for"),
                campaignId: z.string().optional().describe("Exact campaign ID if known"),
                brandName: z
                    .string()
                    .optional()
                    .describe("Brand name to filter campaigns by"),
            }),
            execute: async ({
                campaignName,
                campaignId,
                brandName,
            }: {
                campaignName?: string;
                campaignId?: string;
                brandName?: string;
            }) => {
                if (campaignId) {
                    const campaign = await prisma.campaign.findFirst({
                        where: { id: campaignId, workspaceId },
                        include: {
                            brand: { select: { name: true, contactName: true, contactEmail: true } },
                            deliverables: true,
                            _count: { select: { invoices: true, tasks: true } },
                        },
                    });
                    return campaign || { error: "Campaign not found" };
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const where: any = { workspaceId };

                if (campaignName) {
                    where.name = { contains: campaignName, mode: "insensitive" };
                }
                if (brandName) {
                    where.brand = { name: { contains: brandName, mode: "insensitive" } };
                }

                const campaigns = await prisma.campaign.findMany({
                    where,
                    include: {
                        brand: { select: { name: true } },
                        _count: { select: { deliverables: true, invoices: true } },
                    },
                    orderBy: { updatedAt: "desc" },
                    take: 10,
                });

                return {
                    count: campaigns.length,
                    campaigns: campaigns.map((c: { id: string; name: string; brand: { name: string }; status: string; fee: number | null; startDate: Date | null; endDate: Date | null; _count: { deliverables: number; invoices: number } }) => ({
                        id: c.id,
                        name: c.name,
                        brand: c.brand.name,
                        status: c.status,
                        fee: c.fee,
                        startDate: c.startDate,
                        endDate: c.endDate,
                        deliverables: c._count.deliverables,
                        invoices: c._count.invoices,
                    })),
                };
            },
        }),

        // ─── WRITE TOOLS ─────────────────────────────────────────────

        create_pipeline_entry: tool({
            description:
                "Create a new brand/company entry in the CRM pipeline. Use when the user asks to add a brand, company, or lead to their pipeline.",
            inputSchema: z.object({
                name: z.string().describe("Brand or company name"),
                industry: z.string().optional().describe("Industry (e.g. fashion, tech, food)"),
                website: z.string().optional().describe("Brand website URL"),
                contactName: z.string().optional().describe("Contact person's name"),
                contactEmail: z.string().optional().describe("Contact person's email"),
                contactTitle: z.string().optional().describe("Contact person's job title"),
                source: z
                    .string()
                    .optional()
                    .describe("How you found this brand (e.g. inbound, outreach, referral)"),
                estimatedValue: z
                    .number()
                    .optional()
                    .describe("Estimated deal value in workspace currency"),
                pipelineStage: z
                    .enum(["research", "outreach", "negotiation", "contracted", "active", "completed", "lost"])
                    .optional()
                    .describe("Pipeline stage — defaults to 'research'"),
                notes: z.string().optional().describe("Any notes about the brand"),
            }),
            execute: async (input: {
                name: string;
                industry?: string;
                website?: string;
                contactName?: string;
                contactEmail?: string;
                contactTitle?: string;
                source?: string;
                estimatedValue?: number;
                pipelineStage?: string;
                notes?: string;
            }) => {
                const brand = await prisma.brand.create({
                    data: {
                        workspaceId,
                        name: input.name,
                        industry: input.industry || null,
                        website: input.website || null,
                        contactName: input.contactName || null,
                        contactEmail: input.contactEmail || null,
                        contactTitle: input.contactTitle || null,
                        source: input.source || null,
                        estimatedValue: input.estimatedValue || null,
                        pipelineStage: input.pipelineStage || "research",
                        notes: input.notes || null,
                        tags: [],
                    },
                });

                await prisma.activity.create({
                    data: {
                        workspaceId,
                        type: "brand_created",
                        description: `AI Manager added ${brand.name} to pipeline (${brand.pipelineStage})`,
                        brandId: brand.id,
                        userId: userId || null,
                    },
                });

                return {
                    success: true,
                    brand: {
                        id: brand.id,
                        name: brand.name,
                        pipelineStage: brand.pipelineStage,
                        estimatedValue: brand.estimatedValue,
                    },
                    message: `Added ${brand.name} to your pipeline in the "${brand.pipelineStage}" stage.`,
                };
            },
        }),

        update_pipeline_stage: tool({
            description:
                "Move a brand to a different pipeline stage. Use when the user says to move, advance, or change the stage of a brand.",
            inputSchema: z.object({
                brandName: z.string().describe("Name of the brand to move"),
                newStage: z
                    .enum(["research", "outreach", "negotiation", "contracted", "active", "completed", "lost"])
                    .describe("The new pipeline stage"),
                reason: z.string().optional().describe("Reason for the move (logged in activity)"),
            }),
            execute: async ({
                brandName,
                newStage,
                reason,
            }: {
                brandName: string;
                newStage: string;
                reason?: string;
            }) => {
                const brand = await prisma.brand.findFirst({
                    where: {
                        workspaceId,
                        name: { contains: brandName, mode: "insensitive" },
                    },
                });

                if (!brand) {
                    return { error: `No brand found matching "${brandName}". Check the name and try again.` };
                }

                const oldStage = brand.pipelineStage;

                if (oldStage === newStage) {
                    return {
                        success: true,
                        message: `${brand.name} is already in the "${newStage}" stage.`,
                    };
                }

                await prisma.brand.update({
                    where: { id: brand.id },
                    data: { pipelineStage: newStage },
                });

                await prisma.activity.create({
                    data: {
                        workspaceId,
                        type: "stage_changed",
                        description: `AI Manager moved ${brand.name} from "${oldStage}" to "${newStage}"${reason ? ` — ${reason}` : ""}`,
                        brandId: brand.id,
                        userId: userId || null,
                    },
                });

                return {
                    success: true,
                    brand: { id: brand.id, name: brand.name },
                    oldStage,
                    newStage,
                    message: `Moved ${brand.name} from "${oldStage}" to "${newStage}".`,
                };
            },
        }),

        draft_email: tool({
            description:
                "Draft an outreach or follow-up email for a brand. Saves it as a draft in the email system. Use when the user asks you to write, draft, or compose an email to a brand.",
            inputSchema: z.object({
                brandName: z.string().describe("Name of the brand to email"),
                subject: z.string().describe("Email subject line"),
                body: z.string().describe("Full email body (can use markdown/HTML)"),
                direction: z
                    .enum(["outbound", "inbound"])
                    .optional()
                    .describe("Direction — defaults to outbound"),
            }),
            execute: async ({
                brandName,
                subject,
                body,
                direction,
            }: {
                brandName: string;
                subject: string;
                body: string;
                direction?: string;
            }) => {
                const brand = await prisma.brand.findFirst({
                    where: {
                        workspaceId,
                        name: { contains: brandName, mode: "insensitive" },
                    },
                    select: { id: true, name: true, contactEmail: true, contactName: true },
                });

                if (!brand) {
                    return {
                        error: `No brand found matching "${brandName}". Add them to your pipeline first.`,
                    };
                }

                const email = await prisma.email.create({
                    data: {
                        workspaceId,
                        brandId: brand.id,
                        direction: direction || "outbound",
                        subject,
                        body,
                        toEmail: brand.contactEmail || "",
                        status: "draft",
                    },
                });

                await prisma.activity.create({
                    data: {
                        workspaceId,
                        type: "email_drafted",
                        description: `AI Manager drafted email "${subject}" for ${brand.name}`,
                        brandId: brand.id,
                        userId: userId || null,
                    },
                });

                return {
                    success: true,
                    email: {
                        id: email.id,
                        subject: email.subject,
                        to: brand.contactEmail || "(no email on file)",
                    },
                    message: `Draft email saved: "${subject}" to ${brand.contactName || brand.name}${brand.contactEmail ? ` (${brand.contactEmail})` : ""}`,
                };
            },
        }),

        generate_pitch: tool({
            description:
                "Generate a personalised outreach pitch email for a brand using the creator's profile, stats, and past work. Use when the user asks you to write a pitch, cold email, or outreach message.",
            inputSchema: z.object({
                brandName: z.string().describe("Name of the brand to pitch"),
                pitchType: z
                    .enum(["cold", "warm", "follow_up", "inbound_response"])
                    .describe(
                        "Type of pitch: cold (never spoken), warm (some prior contact), follow_up (continuing conversation), inbound_response (brand reached out)"
                    ),
                additionalContext: z
                    .string()
                    .optional()
                    .describe("Extra context: what product, campaign idea, specific angle, etc."),
            }),
            execute: async ({
                brandName,
                pitchType,
                additionalContext,
            }: {
                brandName: string;
                pitchType: string;
                additionalContext?: string;
            }) => {
                // Fetch brand from pipeline
                const brand = await prisma.brand.findFirst({
                    where: {
                        workspaceId,
                        name: { contains: brandName, mode: "insensitive" },
                    },
                });

                // Fetch creator's brand profile
                const profile = await prisma.brandProfile.findUnique({
                    where: { workspaceId },
                });

                // Fetch platforms
                const platforms = await prisma.platform.findMany({
                    where: { workspaceId },
                });

                // Fetch case studies
                const caseStudies = await prisma.caseStudy.findMany({
                    where: { workspaceId },
                    take: 5,
                    orderBy: { createdAt: "desc" },
                });

                // Return context for the LLM to compose the pitch inline
                return {
                    instruction: "Use the data below to compose the pitch email. Return the subject line and body separately. Make it personal, specific, and compelling.",
                    pitchType,
                    additionalContext: additionalContext || null,
                    brandInfo: brand
                        ? {
                            name: brand.name,
                            industry: brand.industry,
                            contactName: brand.contactName,
                            contactTitle: brand.contactTitle,
                            website: brand.website,
                        }
                        : { name: brandName, note: "Brand not in pipeline yet" },
                    creatorProfile: profile
                        ? {
                            name: profile.brandName,
                            tagline: profile.tagline,
                            bio: profile.bio,
                            toneOfVoice: profile.toneOfVoice,
                            categories: profile.contentCategories,
                            differentiators: profile.keyDifferentiators,
                            audience: profile.audienceSummary,
                            rateCard: profile.rateCard,
                        }
                        : null,
                    platforms: platforms.map((p: { type: string; handle: string; followers: number | null; avgViews: number | null; engagementRate: number | null }) => ({
                        type: p.type,
                        handle: p.handle,
                        followers: p.followers,
                        avgViews: p.avgViews,
                        engagement: p.engagementRate,
                    })),
                    pastWork: caseStudies.map((cs: { brandName: string; industry: string | null; result: string }) => ({
                        brand: cs.brandName,
                        industry: cs.industry,
                        result: cs.result,
                    })),
                };
            },
        }),

        create_campaign: tool({
            description:
                "Create a new campaign for a brand. Use when the user says to start a campaign, create a deal, or set up a partnership.",
            inputSchema: z.object({
                brandName: z.string().describe("Name of the brand (must exist in pipeline)"),
                campaignName: z.string().describe("Name for the campaign"),
                brief: z.string().optional().describe("Campaign brief / description"),
                fee: z.number().optional().describe("Agreed or proposed fee"),
                startDate: z.string().optional().describe("Campaign start date (ISO format)"),
                endDate: z.string().optional().describe("Campaign end date (ISO format)"),
                paymentTerms: z.string().optional().describe("Payment terms e.g. net-30, 50/50"),
                usageRights: z.string().optional().describe("Content usage rights"),
                exclusivity: z.string().optional().describe("Exclusivity terms"),
            }),
            execute: async (input: {
                brandName: string;
                campaignName: string;
                brief?: string;
                fee?: number;
                startDate?: string;
                endDate?: string;
                paymentTerms?: string;
                usageRights?: string;
                exclusivity?: string;
            }) => {
                const brand = await prisma.brand.findFirst({
                    where: {
                        workspaceId,
                        name: { contains: input.brandName, mode: "insensitive" },
                    },
                });

                if (!brand) {
                    return {
                        error: `No brand found matching "${input.brandName}". Add them to the pipeline first.`,
                    };
                }

                const campaign = await prisma.campaign.create({
                    data: {
                        workspaceId,
                        brandId: brand.id,
                        name: input.campaignName,
                        brief: input.brief || null,
                        fee: input.fee || null,
                        startDate: input.startDate ? new Date(input.startDate) : null,
                        endDate: input.endDate ? new Date(input.endDate) : null,
                        paymentTerms: input.paymentTerms || null,
                        usageRights: input.usageRights || null,
                        exclusivity: input.exclusivity || null,
                        status: "draft",
                    },
                });

                await prisma.activity.create({
                    data: {
                        workspaceId,
                        type: "campaign_created",
                        description: `AI Manager created campaign "${campaign.name}" for ${brand.name}`,
                        brandId: brand.id,
                        campaignId: campaign.id,
                        userId: userId || null,
                    },
                });

                return {
                    success: true,
                    campaign: {
                        id: campaign.id,
                        name: campaign.name,
                        brand: brand.name,
                        fee: campaign.fee,
                        status: campaign.status,
                    },
                    message: `Created campaign "${campaign.name}" for ${brand.name}${campaign.fee ? ` (£${campaign.fee})` : ""}.`,
                };
            },
        }),
    };
}
