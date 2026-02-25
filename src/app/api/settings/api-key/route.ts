import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encryptApiKey } from "@/lib/encryption";
import { testApiKey } from "@/lib/anthropic";

// Helper to get workspace ID from session
async function getWorkspaceId() {
    try {
        const session = await auth();
        console.log("[api-key] auth() returned session:", session ? "YES" : "NO", session?.user?.id);

        // The session callback in auth.ts already attaches activeWorkspaceId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workspaceId = (session as any)?.activeWorkspaceId;
        console.log("[api-key] activeWorkspaceId from session:", workspaceId);

        if (workspaceId) return workspaceId as string;

        // Fallback: if activeWorkspaceId isn't on session, try membership lookup
        if (session?.user?.id) {
            console.log("[api-key] Falling back to DB membership lookup for user:", session.user.id);
            const membership = await prisma.membership.findFirst({
                where: { userId: session.user.id },
            });
            console.log("[api-key] Membership found:", membership?.workspaceId);
            return membership?.workspaceId ?? null;
        }

        return null;
    } catch (error) {
        console.error("[api-key] auth error:", error);
        return null;
    }
}

/**
 * GET /api/settings/api-key
 * Returns whether an API key is configured (never returns the actual key)
 */
export async function GET() {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await prisma.brandProfile.findUnique({
            where: { workspaceId },
            select: { anthropicApiKey: true, updatedAt: true },
        });

        return NextResponse.json({
            hasKey: !!profile?.anthropicApiKey,
            lastUpdated: profile?.anthropicApiKey ? profile.updatedAt.toISOString() : null,
        });
    } catch (error) {
        console.error("Error checking API key:", error);
        return NextResponse.json({ error: "Failed to check API key" }, { status: 500 });
    }
}

/**
 * POST /api/settings/api-key
 * Saves an encrypted API key after testing it.
 * Body: { apiKey: string, skipTest?: boolean }
 */
export async function POST(req: Request) {
    console.log("[api-key] POST request received");
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { apiKey, skipTest } = await req.json();

        if (!apiKey || typeof apiKey !== "string") {
            return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }

        // Basic format validation
        if (!apiKey.startsWith("sk-ant-")) {
            return NextResponse.json(
                { error: "Invalid key format. Anthropic API keys start with 'sk-ant-'" },
                { status: 400 }
            );
        }

        // Test the key unless explicitly skipped
        if (!skipTest) {
            const result = await testApiKey(apiKey);
            if (!result.valid) {
                return NextResponse.json(
                    { error: result.error.message, errorType: result.error.type },
                    { status: 422 }
                );
            }
        }

        // Encrypt and store
        const encryptedKey = encryptApiKey(apiKey);

        await prisma.brandProfile.upsert({
            where: { workspaceId },
            update: { anthropicApiKey: encryptedKey },
            create: {
                workspaceId,
                brandName: "My Brand", // default if profile doesn't exist yet
                anthropicApiKey: encryptedKey,
            },
        });

        return NextResponse.json({ success: true, message: "API key saved and verified" });
    } catch (error) {
        console.error("Error saving API key:", error);
        return NextResponse.json({ error: "Failed to save API key" }, { status: 500 });
    }
}

/**
 * DELETE /api/settings/api-key
 * Removes the stored API key
 */
export async function DELETE() {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.brandProfile.update({
            where: { workspaceId },
            data: { anthropicApiKey: null },
        });

        return NextResponse.json({ success: true, message: "API key removed" });
    } catch (error) {
        console.error("Error removing API key:", error);
        return NextResponse.json({ error: "Failed to remove API key" }, { status: 500 });
    }
}
