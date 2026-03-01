import { NextRequest, NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY ?? "";

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get("query") || "lifestyle creator";
    const perPage = req.nextUrl.searchParams.get("per_page") || "18";
    const page = req.nextUrl.searchParams.get("page") || "1";

    if (!PEXELS_API_KEY) {
        return NextResponse.json({ error: "Pexels API key not configured" }, { status: 500 });
    }

    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
            { headers: { Authorization: PEXELS_API_KEY } }
        );

        if (!res.ok) {
            return NextResponse.json({ error: "Pexels search failed" }, { status: res.status });
        }

        const data = await res.json();

        // Return only what we need — keeps payload lean and API key off the client
        const photos = (data.photos ?? []).map((p: {
            id: number;
            src: { large2x: string; medium: string };
            photographer: string;
            photographer_url: string;
            alt: string;
        }) => ({
            id: p.id,
            url: p.src.large2x,
            thumbnail: p.src.medium,
            photographer: p.photographer,
            photographerUrl: p.photographer_url,
            alt: p.alt,
        }));

        return NextResponse.json({ photos, totalResults: data.total_results });
    } catch {
        return NextResponse.json({ error: "Failed to fetch from Pexels" }, { status: 500 });
    }
}
