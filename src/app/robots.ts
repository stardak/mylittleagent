import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mylittleagent.co";

    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/privacy", "/terms"],
                // Keep authenticated, admin, and API routes out of search indexes
                disallow: [
                    "/api/",
                    "/dashboard/",
                    "/onboarding/",
                    "/pipeline/",
                    "/campaigns/",
                    "/calendar/",
                    "/invoices/",
                    "/analytics/",
                    "/outreach/",
                    "/settings/",
                    "/media-card/",
                    "/rate-card/",
                    "/templates/",
                    "/admin/",
                ],
            },
        ],
        sitemap: `${appUrl}/sitemap.xml`,
    };
}
