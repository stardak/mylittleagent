import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkForReply } from "@/lib/gmail";

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the workspace for this user
    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });
    if (!membership) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    // Find all sent outreaches with a threadId that haven't been marked as replied
    const outreaches = await prisma.outreach.findMany({
        where: {
            workspaceId: membership.workspaceId,
            gmailThreadId: { not: null },
            repliedAt: null,
            status: { in: ["sent", "followed_up"] },
        },
        select: { id: true, gmailThreadId: true },
    });

    const updates: string[] = [];

    for (const outreach of outreaches) {
        if (!outreach.gmailThreadId) continue;
        const hasReply = await checkForReply(session.user.id, outreach.gmailThreadId);
        if (hasReply) {
            await prisma.outreach.update({
                where: { id: outreach.id },
                data: { repliedAt: new Date(), status: "replied" },
            });
            updates.push(outreach.id);
        }
    }

    return NextResponse.json({ checked: outreaches.length, repliesFound: updates.length, updated: updates });
}
