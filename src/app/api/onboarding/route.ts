import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getWorkspaceId() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });
    return membership?.workspaceId ?? null;
}

// GET /api/onboarding — load existing data for pre-filling forms
export async function GET() {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [brandProfile, platforms, caseStudies, testimonials, settings] = await Promise.all([
            prisma.brandProfile.findUnique({ where: { workspaceId } }),
            prisma.platform.findMany({ where: { workspaceId } }),
            prisma.caseStudy.findMany({ where: { workspaceId } }),
            prisma.testimonial.findMany({ where: { workspaceId } }),
            prisma.setting.findMany({ where: { workspaceId } }),
        ]);

        const getSettingValue = (key: string) => settings.find((s) => s.key === key)?.value;

        return NextResponse.json({
            brandName: brandProfile?.brandName || "",
            website: brandProfile?.website || "",
            tagline: brandProfile?.tagline || "",
            bio: brandProfile?.bio || "",
            location: brandProfile?.location || "",
            contactEmail: brandProfile?.contactEmail || "",
            toneOfVoice: brandProfile?.toneOfVoice || "",
            contentCategories: brandProfile?.contentCategories || [],
            keyDifferentiators: brandProfile?.keyDifferentiators || "",
            platforms: platforms.map((p) => ({
                type: p.type,
                handle: p.handle || "",
                followers: p.followers?.toString() || "",
                avgViews: p.avgViews?.toString() || "",
                engagementRate: p.engagementRate?.toString() || "",
            })),
            audienceSummary: brandProfile?.audienceSummary || "",
            caseStudies: caseStudies.map((cs) => ({
                brandName: cs.brandName,
                industry: cs.industry || "",
                brief: cs.brief || "",
                result: cs.result || "",
                contentUrl: cs.contentUrl || "",
            })),
            testimonials: testimonials.map((t) => ({
                quote: t.quote,
                authorName: t.authorName || "",
                authorTitle: t.authorTitle || "",
                company: t.company || "",
            })),
            businessName: brandProfile?.businessName || "",
            businessAddress: brandProfile?.businessAddress || "",
            vatNumber: brandProfile?.vatNumber || "",
            bankDetails: brandProfile?.bankDetails || "",
            paymentTerms: brandProfile?.paymentTerms || "net-30",
            currency: brandProfile?.currency || "GBP",
            rateCard: brandProfile?.rateCard ? JSON.stringify(brandProfile.rateCard) : "",
            anthropicApiKey: "",  // Never return the actual key
            aiManagerName: getSettingValue("ai_manager_name") || "AI Manager",
            emailFromName: getSettingValue("email_from_name") || "",
            emailSignature: getSettingValue("email_signature") || "",
        });
    } catch (error) {
        console.error("Load onboarding data error:", error);
        return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's workspace
        const membership = await prisma.membership.findFirst({
            where: { userId: session.user.id },
            include: { workspace: true },
        });

        if (!membership) {
            return NextResponse.json({ error: "No workspace found" }, { status: 404 });
        }

        const workspaceId = membership.workspaceId;
        const { step, data } = await req.json();

        // Update brand profile based on which step we're saving
        switch (step) {
            case "brand":
                await prisma.brandProfile.upsert({
                    where: { workspaceId },
                    update: { brandName: data.brandName },
                    create: { workspaceId, brandName: data.brandName },
                });
                if (data.website) {
                    await prisma.brandProfile.update({
                        where: { workspaceId },
                        data: { website: data.website },
                    });
                }
                break;

            case "profile":
                await prisma.brandProfile.update({
                    where: { workspaceId },
                    data: {
                        tagline: data.tagline || undefined,
                        bio: data.bio || undefined,
                        location: data.location || undefined,
                        contactEmail: data.contactEmail || undefined,
                        toneOfVoice: data.toneOfVoice || undefined,
                        contentCategories: data.contentCategories || [],
                        keyDifferentiators: data.keyDifferentiators || undefined,
                    },
                });
                break;

            case "platforms":
                // Delete existing platforms, then create new ones
                await prisma.platform.deleteMany({ where: { workspaceId } });
                if (data.platforms?.length > 0) {
                    const typeLabels: Record<string, string> = {
                        youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok",
                        twitter: "X/Twitter", facebook: "Facebook", linkedin: "LinkedIn",
                        podcast: "Podcast", blog: "Blog",
                    };
                    await prisma.platform.createMany({
                        data: data.platforms.map((p: { type: string; handle: string; followers: string; avgViews: string; engagementRate: string }) => ({
                            workspaceId,
                            type: p.type,
                            handle: p.handle,
                            displayName: typeLabels[p.type.toLowerCase()] || p.type,
                            followers: p.followers ? parseInt(p.followers) : null,
                            avgViews: p.avgViews ? parseInt(p.avgViews) : null,
                            engagementRate: p.engagementRate ? parseFloat(p.engagementRate) : null,
                        })),
                    });
                }
                break;

            case "audience":
                await prisma.brandProfile.update({
                    where: { workspaceId },
                    data: { audienceSummary: data.audienceSummary || undefined },
                });
                break;

            case "casestudies":
                // Delete existing, then create new
                await prisma.caseStudy.deleteMany({ where: { workspaceId } });
                if (data.caseStudies?.length > 0) {
                    await prisma.caseStudy.createMany({
                        data: data.caseStudies.map((cs: { brandName: string; industry: string; brief: string; result: string; contentUrl?: string }) => ({
                            workspaceId,
                            brandName: cs.brandName,
                            industry: cs.industry || null,
                            brief: cs.brief || null,
                            result: cs.result || null,
                            contentUrl: cs.contentUrl || null,
                        })),
                    });
                }
                break;

            case "testimonials":
                // Delete existing, then create new
                await prisma.testimonial.deleteMany({ where: { workspaceId } });
                if (data.testimonials?.length > 0) {
                    await prisma.testimonial.createMany({
                        data: data.testimonials.map((t: { quote: string; authorName: string; authorTitle: string; company: string }) => ({
                            workspaceId,
                            quote: t.quote,
                            authorName: t.authorName || null,
                            authorTitle: t.authorTitle || null,
                            company: t.company || null,
                        })),
                    });
                }
                break;

            case "business":
                await prisma.brandProfile.update({
                    where: { workspaceId },
                    data: {
                        businessName: data.businessName || undefined,
                        businessAddress: data.businessAddress || undefined,
                        vatNumber: data.vatNumber || undefined,
                        bankDetails: data.bankDetails || undefined,
                        paymentTerms: data.paymentTerms || undefined,
                        currency: data.currency || undefined,
                    },
                });
                break;

            case "ratecard":
                await prisma.brandProfile.update({
                    where: { workspaceId },
                    data: { rateCard: data.rateCard || undefined },
                });
                break;

            case "ai_setup":
                // Save the AI manager name
                if (data.aiManagerName) {
                    await prisma.setting.upsert({
                        where: { workspaceId_key: { workspaceId, key: "ai_manager_name" } },
                        update: { value: data.aiManagerName },
                        create: { workspaceId, key: "ai_manager_name", value: data.aiManagerName },
                    });
                }
                // API key is saved via /api/settings/api-key during the test connection step.
                // If the user skipped testing but entered a key, save it here.
                if (data.anthropicApiKey) {
                    const { encryptApiKey } = await import("@/lib/encryption");
                    const encryptedKey = encryptApiKey(data.anthropicApiKey);
                    await prisma.brandProfile.upsert({
                        where: { workspaceId },
                        update: { anthropicApiKey: encryptedKey },
                        create: {
                            workspaceId,
                            brandName: data.brandName || "My Brand",
                            anthropicApiKey: encryptedKey,
                        },
                    });
                }
                break;

            case "email":
                // Store email settings as workspace settings
                if (data.emailFromName) {
                    await prisma.setting.upsert({
                        where: { workspaceId_key: { workspaceId, key: "email_from_name" } },
                        update: { value: data.emailFromName },
                        create: { workspaceId, key: "email_from_name", value: data.emailFromName },
                    });
                }
                if (data.emailSignature) {
                    await prisma.setting.upsert({
                        where: { workspaceId_key: { workspaceId, key: "email_signature" } },
                        update: { value: data.emailSignature },
                        create: { workspaceId, key: "email_signature", value: data.emailSignature },
                    });
                }

                // Mark onboarding as complete
                await prisma.setting.upsert({
                    where: { workspaceId_key: { workspaceId, key: "onboarding_complete" } },
                    update: { value: "true" },
                    create: { workspaceId, key: "onboarding_complete", value: "true" },
                });
                break;

            case "done":
                // Mark onboarding as complete
                await prisma.setting.upsert({
                    where: { workspaceId_key: { workspaceId, key: "onboarding_complete" } },
                    update: { value: "true" },
                    create: { workspaceId, key: "onboarding_complete", value: "true" },
                });
                break;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Onboarding save error:", error);
        return NextResponse.json(
            { error: "Failed to save onboarding data" },
            { status: 500 }
        );
    }
}
