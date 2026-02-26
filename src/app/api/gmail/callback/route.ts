import { NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";

const GMAIL_PROVIDER_ID = "google-gmail";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId passed via state
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL || "https://mylittleagent.vercel.app";

    if (error || !code || !state) {
        return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&gmail=error`);
    }

    try {
        const oauth2 = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            `${baseUrl}/api/gmail/callback`
        );

        const { tokens } = await oauth2.getToken(code);
        oauth2.setCredentials(tokens);

        // Get the Gmail address for this account
        const gmail = google.gmail({ version: "v1", auth: oauth2 });
        const profile = await gmail.users.getProfile({ userId: "me" });
        const gmailEmail = profile.data.emailAddress ?? "";

        // Upsert the account record for google-gmail provider
        const existingAccount = await prisma.account.findFirst({
            where: { userId: state, provider: GMAIL_PROVIDER_ID },
        });

        if (existingAccount) {
            await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                    access_token: tokens.access_token ?? null,
                    refresh_token: tokens.refresh_token ?? existingAccount.refresh_token,
                    expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
                    scope: tokens.scope ?? null,
                    id_token: tokens.id_token ?? null,
                },
            });
        } else {
            await prisma.account.create({
                data: {
                    userId: state,
                    type: "oauth",
                    provider: GMAIL_PROVIDER_ID,
                    providerAccountId: gmailEmail,
                    access_token: tokens.access_token ?? null,
                    refresh_token: tokens.refresh_token ?? null,
                    expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
                    scope: tokens.scope ?? null,
                    token_type: tokens.token_type ?? null,
                    id_token: tokens.id_token ?? null,
                },
            });
        }

        return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&gmail=connected`);
    } catch (err) {
        console.error("[Gmail callback error]", err);
        return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&gmail=error`);
    }
}
