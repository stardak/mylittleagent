import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendGmailMessage } from "@/lib/gmail";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const emailNumber: 1 | 2 = body.emailNumber ?? 1;
    const includeMediaCard: boolean = body.includeMediaCard === true;

    const outreach = await prisma.outreach.findUnique({ where: { id } });
    if (!outreach) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const subject = emailNumber === 1 ? outreach.email1Subject : outreach.email2Subject;
    const emailBody = emailNumber === 1 ? outreach.email1Body : outreach.email2Body;

    if (!subject || !emailBody) {
        return NextResponse.json({ error: "Email content not found — generate emails first" }, { status: 400 });
    }

    // Look up workspace mediaPdfUrl for PDF attachment (Email 1 only)
    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    if (includeMediaCard && emailNumber === 1) {
        const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
        if (membership) {
            const bp = await prisma.brandProfile.findUnique({
                where: { workspaceId: membership.workspaceId },
                select: { mediaPdfUrl: true, brandName: true },
            });
            if (bp?.mediaPdfUrl) {
                attachmentUrl = bp.mediaPdfUrl;
                attachmentName = `${bp.brandName ?? "media"}-card.pdf`;
            }
        }
    }

    try {
        const sent = await sendGmailMessage(session.user.id, {
            to: outreach.contactEmail ?? "",
            subject,
            body: emailBody,
            // For email 2, reply to the original thread
            threadId: emailNumber === 2 ? (outreach.gmailThreadId ?? undefined) : undefined,
            attachmentUrl,
            attachmentName,
        });

        // Persist the thread ID and mark as sent
        const updateData: Record<string, unknown> = {
            gmailThreadId: sent.threadId,
        };

        if (emailNumber === 1) {
            updateData.email1SentAt = new Date();
            updateData.status = "sent";
        } else {
            updateData.email2SentAt = new Date();
            updateData.status = "followed_up";
        }

        const updated = await prisma.outreach.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, outreach: updated, gmailMessageId: sent.messageId });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to send email";
        if (message.includes("Gmail not connected")) {
            return NextResponse.json({ error: "Gmail not connected. Connect in Settings → Integrations." }, { status: 400 });
        }
        console.error("[send-email error]", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
