import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { WebsiteRenderer } from "./_sections/WebsiteRenderer";
import { auth } from "@/lib/auth";

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ preview?: string }>;
}

async function getWebsiteData(slug: string) {
    const website = await prisma.creatorWebsite.findUnique({
        where: { slug },
        include: {
            workspace: {
                include: {
                    brandProfile: true,
                    platforms: { orderBy: { followers: "desc" } },
                    caseStudies: { orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
                    testimonials: { orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
                },
            },
        },
    });
    return website;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const website = await getWebsiteData(slug);

    if (!website || !website.isPublished) {
        return { title: "Creator Website" };
    }

    const profile = website.workspace.brandProfile;
    const title = website.seoTitle ?? profile?.brandName ?? "Creator Website";
    const description =
        website.seoDescription ?? profile?.tagline ?? profile?.bio?.slice(0, 155) ?? "";

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: profile?.heroImageUrl ? [{ url: profile.heroImageUrl }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function CreatorWebsitePage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { preview } = await searchParams;
    const website = await getWebsiteData(slug);

    if (!website) {
        notFound();
    }

    // Allow preview mode (from the editor iframe) if user is authenticated
    const isPreviewMode = preview === "1" && !!(await auth())?.user?.id;

    if (!website.isPublished && !isPreviewMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e]">
                <div className="text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-white/40 text-sm tracking-widest uppercase">Coming Soon</p>
                    <h1 className="text-white text-3xl font-semibold mt-3">
                        {website.workspace.brandProfile?.brandName ?? slug}
                    </h1>
                    <p className="text-white/40 mt-2">This website is currently being set up.</p>
                </div>
            </div>
        );
    }


    const { workspace } = website;
    const profile = workspace.brandProfile;
    const theme = (website.theme as { accentColor?: string; headingFont?: string; darkMode?: boolean } | null) ?? {};
    const accentColor = theme.accentColor ?? profile?.primaryColor ?? "#1A9E96";
    const headingFont = theme.headingFont ?? profile?.headingFont ?? "Georgia";
    const sections = (website.sections as { id: string; visible: boolean }[]) ?? [];

    return (
        <WebsiteRenderer
            website={website as Parameters<typeof WebsiteRenderer>[0]["website"]}
            profile={profile}
            platforms={workspace.platforms}
            caseStudies={workspace.caseStudies}
            testimonials={workspace.testimonials}
            sections={sections}
            accentColor={accentColor}
            headingFont={headingFont}
            slug={slug}
        />
    );
}
