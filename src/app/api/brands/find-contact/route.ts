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
    verified?: boolean;
};

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const ROLE_KEYWORDS = [
    "influencer", "creator", "partnership", "partnerships", "affiliate",
    "brand", "collaboration", "pr", "press", "marketing", "comms",
    "communications", "sponsorship",
];

function extractEmail(text: string): string | null {
    const matches = text.match(EMAIL_RE);
    if (!matches) return null;
    const filtered = matches.filter(
        (e) => !e.startsWith("noreply") && !e.startsWith("no-reply") && !e.startsWith("support")
    );
    return filtered[0] ?? null;
}

function extractRole(text: string): string | null {
    const patterns = [
        /(?:head|director|manager|lead|vp|vice president|coordinator|executive)\s+of\s+[\w\s]+(?:influencer|creator|partnership|affiliate|sponsorship|marketing|brand|pr)[^\n,.;]*/gi,
        /(?:influencer|creator|partnership|affiliate|sponsorship|brand)\s+[\w\s]*(?:head|director|manager|lead|coordinator|executive)[^\n,.;]*/gi,
    ];
    for (const pat of patterns) {
        const match = text.match(pat);
        if (match) return match[0].trim().slice(0, 80);
    }
    return null;
}

function extractName(text: string): string | null {
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

async function hunterDomainSearch(domain: string, apiKey: string): Promise<ContactCandidate[]> {
    // Search marketing + partnerships departments
    const departments = ["marketing", "communications"];
    const results: ContactCandidate[] = [];
    const seenEmails = new Set<string>();

    for (const dept of departments) {
        try {
            const url = new URL("https://api.hunter.io/v2/domain-search");
            url.searchParams.set("domain", domain);
            url.searchParams.set("department", dept);
            url.searchParams.set("limit", "5");
            url.searchParams.set("api_key", apiKey);

            const res = await fetch(url.toString());
            if (!res.ok) continue;

            const data = await res.json();
            const emails: {
                value: string;
                first_name?: string;
                last_name?: string;
                position?: string;
                confidence?: number;
            }[] = data?.data?.emails ?? [];

            for (const e of emails) {
                if (seenEmails.has(e.value)) continue;
                seenEmails.add(e.value);

                const name = e.first_name && e.last_name
                    ? `${e.first_name} ${e.last_name}`
                    : null;

                // Only include if role sounds relevant
                const role = e.position ?? null;
                const isRelevant = !role || ROLE_KEYWORDS.some((kw) =>
                    role.toLowerCase().includes(kw)
                );
                if (!isRelevant) continue;

                results.push({
                    name,
                    role,
                    email: e.value,
                    source: `Hunter.io – ${domain}`,
                    snippet: `Verified email found via Hunter.io (${e.confidence ?? "?"}% confidence)`,
                    verified: true,
                });
            }
        } catch {
            // Don't fail the whole request if one department errors
        }
    }

    return results;
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

    const tavilyKey = process.env.TAVILY_API_KEY;
    const hunterKey = process.env.HUNTER_API_KEY;

    if (!tavilyKey && !hunterKey) {
        return NextResponse.json(
            { error: "No search API keys configured. Add TAVILY_API_KEY or HUNTER_API_KEY to your environment variables." },
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

    // Run Tavily + Hunter in parallel
    const [tavilyResult, hunterResult] = await Promise.allSettled([
        // Tavily searches
        tavilyKey
            ? Promise.all([
                tavilySearch(`"${brandName}" influencer marketing partnerships contact email`, tavilyKey),
                tavilySearch(
                    domain
                        ? `"${brandName}" creator partnerships contact site:${domain}`
                        : `"${brandName}" influencer partnerships press contact email`,
                    tavilyKey
                ),
            ])
            : Promise.resolve(null),

        // Hunter domain search
        hunterKey && domain
            ? hunterDomainSearch(domain, hunterKey)
            : Promise.resolve([]),
    ]);

    const candidates: ContactCandidate[] = [];
    const seenEmails = new Set<string>();

    // ── Hunter results first (verified emails → highest quality) ──
    if (hunterResult.status === "fulfilled" && hunterResult.value) {
        for (const c of hunterResult.value) {
            if (c.email && seenEmails.has(c.email)) continue;
            if (c.email) seenEmails.add(c.email);
            candidates.push(c);
        }
    }

    // ── Tavily results ──
    if (tavilyResult.status === "fulfilled" && tavilyResult.value) {
        const tavilyPairs = tavilyResult.value as [{ answer?: string; results?: { url: string; content: string; title: string }[] }, { answer?: string; results?: { url: string; content: string; title: string }[] }];

        const allResults: { url: string; content: string; title: string }[] = [];
        const answers: string[] = [];

        for (const r of tavilyPairs) {
            if (r?.results) allResults.push(...r.results);
            if (r?.answer) answers.push(r.answer);
        }

        for (const answer of answers) {
            const email = extractEmail(answer);
            const role = extractRole(answer);
            const name = extractName(answer);
            if (email && seenEmails.has(email)) continue;
            if (email) seenEmails.add(email);
            if (email || role || name) {
                candidates.push({ name, role, email, source: "AI Summary", snippet: answer.slice(0, 200) });
            }
        }

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
    }

    return NextResponse.json({ candidates: candidates.slice(0, 8) });
}
