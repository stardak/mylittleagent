import { NextRequest, NextResponse } from "next/server";

/**
 * Edge Middleware — handles two concerns for the creator-manager app:
 *
 * 1. Security headers — applied to every response
 * 2. Rate limiting — sliding window per IP for public/unauthenticated routes:
 *      /api/public/*          → 60 req / 60 s
 *      /[slug]/mediacard      → 30 req / 60 s
 */

// ── Security headers ──────────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
    // Prevent clickjacking — only allow framing from same origin
    "X-Frame-Options": "SAMEORIGIN",
    // Block MIME-type sniffing
    "X-Content-Type-Options": "nosniff",
    // Force HTTPS for 1 year (includeSubDomains) — Vercel always serves HTTPS
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    // Disable browser features the app doesn't need
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    // Referrer — send origin only on cross-origin requests
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Basic CSP — blocks inline scripts from other origins; allows Vercel Blob images
    // Kept permissive for 'script-src' so Next.js runtime and Sentry work out of the box.
    // Tighten further once you've audited all third-party scripts.
    "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://vercel.live",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        // Platform logo icons (gauravghongde/social-icons via jsDelivr) + YouTube thumbnails
        "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://lh3.googleusercontent.com https://cdn.jsdelivr.net https://img.youtube.com https://i.ytimg.com",
        "connect-src 'self' https://*.sentry.io https://vitals.vercel-insights.com",
        // Allow YouTube/Vimeo embeds in the website sections
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
        "frame-ancestors 'self'",
    ].join("; "),
};

function applySecurityHeaders(response: NextResponse): NextResponse {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }
    return response;
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

interface WindowEntry {
    count: number;
    windowStart: number;
}

const store = new Map<string, WindowEntry>();
const WINDOW_MS = 60_000; // 1 minute

function isRateLimited(key: string, limit: number): { limited: boolean; retryAfter: number } {
    const now = Date.now();

    // Prune stale entries every call (cheap at this scale)
    for (const [k, v] of store.entries()) {
        if (now - v.windowStart > WINDOW_MS) store.delete(k);
    }

    const entry = store.get(key);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
        store.set(key, { count: 1, windowStart: now });
        return { limited: false, retryAfter: 0 };
    }

    entry.count++;

    if (entry.count > limit) {
        const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
        return { limited: true, retryAfter };
    }

    return { limited: false, retryAfter: 0 };
}

function getIP(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}

// ── Middleware entrypoint ─────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const ip = getIP(req);

    // --- Rate limiting (public routes only) ---
    let limit = 0;
    if (pathname.startsWith("/api/public/")) {
        limit = 60;
    } else if (/^\/[a-z0-9-]+\/mediacard/.test(pathname)) {
        limit = 30;
    }

    if (limit > 0) {
        const key = `${ip}:${pathname.startsWith("/api/public/") ? "api-public" : "mediacard"}`;
        const { limited, retryAfter } = isRateLimited(key, limit);

        if (limited) {
            const res = new NextResponse(
                JSON.stringify({ error: "Too many requests. Please slow down." }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": String(retryAfter),
                        "X-RateLimit-Limit": String(limit),
                    },
                }
            );
            return applySecurityHeaders(res);
        }
    }

    // --- Security headers on every response ---
    return applySecurityHeaders(NextResponse.next());
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static  (static files)
         * - _next/image   (image optimisation)
         * - favicon.ico
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
