import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";

const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
];

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        `${process.env.NEXT_PUBLIC_AUTH_URL || "https://mylittleagent.vercel.app"}/api/gmail/callback`
    );

    const url = oauth2.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",   // force refresh_token every time
        scope: SCOPES,
        state: session.user.id, // pass userId through state param
    });

    return NextResponse.json({ url });
}
