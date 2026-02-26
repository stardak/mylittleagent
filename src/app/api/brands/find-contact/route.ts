import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getWorkspaceId() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });
    return membership?.workspaceId ?? null;
}

export type ContactCandidate = {
    name: string | null;
    role: string | null;
    email: string | null;
    source: string;
    snippet: string;
};

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Common partnership / influencer role keywords to look for in snippets
const ROLE_KEYWORDS = [
    "influencer", "creator", "partnership", "partnerships", "affiliate",
    "brand", "collaboration", "pr", "press", "marketing", "comms",
    "communications", "sponsorship",
];

function extractEmail(text: string): string | null {
    const matches = text.match(EMAIL_RE);
    if (!matches) return null;
    // Filter out generic noreply / info addresses
    const filtered = matches.filter(
        (e) => !e.startsWith("noreply") && !e.startsWith("no-reply") && !e.startsWith("support")
    );
    return filtered[0] ?? null;
}

function extractRole(text: string): string | null {
    // Look for patterns like "Head of Influencer Partnerships", "Creator Marketing Manager" etc
    const patterns = [
        /(?:head|director|manager|lead|vp|vice president|coordinator|executive)\s+of\s+[\w\s]+(?:influencer|creator|partnership|affiliate|sponsorship|marketing|brand|pr)[^\n,.;]*/gi,
        /(?:influencer|creator|partnership|affiliate|sponsorship|brand)\s+[\w\s]*(?:head|director|manager|lead|coordinator|executive)[^\n,.;]*/gi,
        /[\w\s]+(?:influencer|creator|partnership)s?\s+(?:team|department)[^\n,.;]*/gi,
    ];
    for (const pat of patterns) {
        const match = text.match(pat);
        if (match) return match[0].trim().slice(0, 80);
    }
    return null;
}

function extractName(text: string): string | null {
    // Look for "Contact: FirstName LastName" or "reach out to FirstName LastName"
    const patterns = [
        /(?:contact|reach\s+out\s+to|email)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
        /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:Head|Director|Manager|Lead|Coordinator)/,
    ];
    for (const pat of patterns) {
        const match = text.match(pat);
        if (match) return match[1];
    }
    return null;
}

function isRelevantSnippet(text: string): boolean {
    const lower = text.toLowerCase();
    return ROLE_KEYWORDS.some((kw) => lower.includes(kw));
}

async function tavilySearch(query: string, apiKey: string) {
    const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            api_key: apiKey,
            query,
            search_depth: "basic",
            max_results: 5,
            include_answer: true,
        }),
    });
    if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
    return res.json();
}

/**
 * POST /api/brands/find-contact
 * Body: { brandName: string, website?: string }
 */
export async function POST(req: Request) {
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Tavily API key not configured. Add TAVILY_API_KEY to your environment variables." },
            { status: 422 }
        );
    }

    const { brandName, website } = await req.json();
    if (!brandName) {
        return NextResponse.json({ error: "brandName is required" }, { status: 400 });
    }

    const domain = website
        ? website.replace(/^https?:\/\//, "").split("/")[0]
        : null;

    // Run two searches in parallel
    const queries = [
        `"${brandName}" influencer marketing partnerships contact email`,
        domain
            ? `"${brandName}" creator partnerships contact site:${domain}`
            : `"${brandName}" influencer partnerships press contact email`,
    ];

    try {
        const [r1, r2] = await Promise.allSettled(
            queries.map((q) => tavilySearch(q, apiKey))
        );

        const allResults: { url: string; content: string; title: string }[] = [];

        for (const r of [r1, r2]) {
            if (r.status === "fulfilled" && r.value?.results) {
                allResults.push(...r.value.results);
            }
        }

        // Also include the AI answer if available
        const answers: string[] = [];
        for (const r of [r1, r2]) {
            if (r.status === "fulfilled" && r.value?.answer) {
                answers.push(r.value.answer);
            }
        }

        const candidates: ContactCandidate[] = [];
        const seenEmails = new Set<string>();

        // Process the AI answer first (most condensed/relevant)
        for (const answer of answers) {
            const email = extractEmail(answer);
            const role = extractRole(answer);
            const name = extractName(answer);
            if (email && !seenEmails.has(email)) {
                seenEmails.add(email);
                candidates.push({ name, role, email, source: "AI Summary", snippet: answer.slice(0, 200) });
            } else if (role || name) {
                candidates.push({ name, role, email: null, source: "AI Summary", snippet: answer.slice(0, 200) });
            }
        }

        // Process individual search results
        for (const result of allResults) {
            const text = `${result.title} ${result.content}`;
            if (!isRelevantSnippet(text)) continue;

            const email = extractEmail(text);
            const role = extractRole(text);
            const name = extractName(text);

            if (email && seenEmails.has(email)) continue;
            if (email) seenEmails.add(email);

            if (email || role || name) {
                candidates.push({
                    name,
                    role,
                    email,
                    source: result.url,
                    snippet: result.content.slice(0, 200),
                });
            }
        }

        return NextResponse.json({ candidates: candidates.slice(0, 6) });
    } catch (err) {
        console.error("Tavily search error:", err);
        return NextResponse.json(
            { error: "Search failed. Check your Tavily API key and try again." },
            { status: 500 }
        );
    }
}
