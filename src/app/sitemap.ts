import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic"; // regenerate on each request so new creator slugs appear

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mylittleagent.co";

    // Static public pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: appUrl,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${appUrl}/privacy`,
            lastModified: new Date("2026-02-27"),
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${appUrl}/terms`,
            lastModified: new Date("2026-02-27"),
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    // Dynamically include all public creator media cards
    try {
        const { default: prisma } = await import("@/lib/prisma");
        const workspaces = await prisma.workspace.findMany({
            select: { slug: true, updatedAt: true },
            where: {
                // Only include workspaces that have a brand profile set up
                brandProfile: { isNot: null },
            },
        });

        const creatorPages: MetadataRoute.Sitemap = workspaces.map((w) => ({
            url: `${appUrl}/${w.slug}/mediacard`,
            lastModified: w.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

        return [...staticPages, ...creatorPages];
    } catch {
        // If the DB isn't reachable during build, return static pages only
        return staticPages;
    }
}
