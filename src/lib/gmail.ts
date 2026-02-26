/**
 * lib/gmail.ts
 * Shared Gmail API helper — token refresh, send, and thread search.
 */
import { google } from "googleapis";
import prisma from "@/lib/prisma";

const GMAIL_PROVIDER_ID = "google-gmail";

/** Fetch the stored Gmail account for a user, refreshing the token if expired. */
export async function getGmailClient(userId: string) {
    const account = await prisma.account.findFirst({
        where: { userId, provider: GMAIL_PROVIDER_ID },
    });
    if (!account?.refresh_token) return null;

    const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        `${process.env.NEXT_PUBLIC_AUTH_URL || "https://mylittleagent.vercel.app"}/api/gmail/callback`
    );

    oauth2.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    // Auto-refresh — googleapis handles this internally when making calls,
    // but we also persist the new token back to DB if it refreshes.
    oauth2.on("tokens", async (tokens) => {
        const updates: Record<string, unknown> = {};
        if (tokens.access_token) updates.access_token = tokens.access_token;
        if (tokens.expiry_date) updates.expires_at = Math.floor(tokens.expiry_date / 1000);
        if (tokens.refresh_token) updates.refresh_token = tokens.refresh_token;
        if (Object.keys(updates).length > 0) {
            await prisma.account.update({
                where: { id: account.id },
                data: updates,
            });
        }
    });

    return { gmail: google.gmail({ version: "v1", auth: oauth2 }), account };
}

/** Build a raw RFC 2822 email message (base64url encoded). */
export function buildRawEmail({
    from,
    to,
    subject,
    body,
    threadId,
    inReplyTo,
    references,
}: {
    from: string;
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
}): { raw: string; threadId?: string } {
    const headers = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
    ];
    if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
    if (references) headers.push(`References: ${references}`);

    const message = [...headers, "", body].join("\r\n");
    const raw = Buffer.from(message).toString("base64url");
    return { raw, threadId };
}

/** Send an email via Gmail API. Returns the sent message details. */
export async function sendGmailMessage(
    userId: string,
    params: {
        to: string;
        subject: string;
        body: string;
        threadId?: string;
        inReplyTo?: string;
        references?: string;
    }
) {
    const result = await getGmailClient(userId);
    if (!result) throw new Error("Gmail not connected");
    const { gmail, account } = result;

    // Get the user's Gmail address
    const profile = await gmail.users.getProfile({ userId: "me" });
    const from = profile.data.emailAddress!;

    const { raw, threadId } = buildRawEmail({ from, ...params });

    const requestBody: { raw: string; threadId?: string } = { raw };
    if (threadId) requestBody.threadId = threadId;

    const sent = await gmail.users.messages.send({
        userId: "me",
        requestBody,
    });

    return {
        messageId: sent.data.id!,
        threadId: sent.data.threadId!,
        from,
        accountId: account.id,
    };
}

/** Search Gmail inbox for replies to a given threadId. */
export async function checkForReply(
    userId: string,
    threadId: string
): Promise<boolean> {
    const result = await getGmailClient(userId);
    if (!result) return false;
    const { gmail } = result;

    try {
        const thread = await gmail.users.threads.get({ userId: "me", id: threadId });
        const messages = thread.data.messages ?? [];
        // If there are 2+ messages in the thread, someone replied
        return messages.length >= 2;
    } catch {
        return false;
    }
}
