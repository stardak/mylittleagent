import type { Metadata } from "next";
import { MediaCardPublicPage } from "./client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mylittleagent.co";

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    try {
        const res = await fetch(`${APP_URL}/api/public/media-card/${slug}`, {
            // Reuse the CDN cache so this doesn't hit the DB on every SSR render
            next: { revalidate: 60 },
        });

        if (!res.ok) throw new Error("Not found");

        const data = await res.json();
        const brand = data.brand;

        const title = `${brand.name} — Media Card`;
        const description =
            brand.tagline ||
            `${brand.name} is a content creator on My Little Agent. View their media card, platforms, and brand partnerships.`;
        const image = brand.heroImageUrl || brand.logoUrl || null;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                url: `${APP_URL}/${slug}/mediacard`,
                siteName: "My Little Agent",
                type: "profile",
                ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: `${brand.name} media card` }] } : {}),
            },
            twitter: {
                card: image ? "summary_large_image" : "summary",
                title,
                description,
                ...(image ? { images: [image] } : {}),
            },
        };
    } catch {
        return {
            title: "Media Card — My Little Agent",
            description: "Creator media card powered by My Little Agent.",
        };
    }
}

export default function PublicMediaCardPage() {
    return <MediaCardPublicPage />;
}
