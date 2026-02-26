/**
 * GET /api/cron/send-followups
 *
 * Daily Vercel Cron Job (runs at 09:00 UTC).
 * Finds all outreach records where:
 *   - autoSendFollowUp = true
 *   - email2DueAt <= now
 *   - email2SentAt is null
 *   - email2Subject + email2Body exist
 *   - status is not replied/archived
 *
 * For each, sends Email 2 via the workspace owner's Gmail account.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendGmailMessage } from "@/lib/gmail";

export async function GET(req: Request) {
    // Verify Vercel cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all overdue auto-send follow-ups with their workspace's owner
    const overdue = await prisma.outreach.findMany({
        where: {
            autoSendFollowUp: true,
            email2SentAt: null,
            email2DueAt: { lte: now },
            email2Subject: { not: null },
            email2Body: { not: null },
            status: { notIn: ["replied", "archived"] },
        },
        include: {
            workspace: {
                include: {
                    members: {
                        where: { role: "owner" },
                        include: { user: true },
                        take: 1,
                    },
                },
            },
        },
    });

    const results: { id: string; status: "sent" | "failed"; error?: string }[] = [];

    for (const outreach of overdue) {
        const ownerMembership = outreach.workspace.members[0];
        if (!ownerMembership?.userId) {
            results.push({ id: outreach.id, status: "failed", error: "No workspace owner found" });
            continue;
        }

        const userId = ownerMembership.userId;

        try {
            const sent = await sendGmailMessage(userId, {
                to: outreach.contactEmail,
                subject: outreach.email2Subject!,
                body: outreach.email2Body!,
                threadId: outreach.gmailThreadId ?? undefined,
            });

            await prisma.outreach.update({
                where: { id: outreach.id },
                data: {
                    email2SentAt: now,
                    gmailThreadId: sent.threadId,
                    status: "followed_up",
                    autoSendFollowUp: false, // disable after sending
                },
            });

            results.push({ id: outreach.id, status: "sent" });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error(`[cron/send-followups] Failed for outreach ${outreach.id}:`, message);
            results.push({ id: outreach.id, status: "failed", error: message });
        }
    }

    console.log(`[cron/send-followups] Processed ${overdue.length} follow-ups:`, results);

    return NextResponse.json({
        processed: overdue.length,
        results,
        timestamp: now.toISOString(),
    });
}
