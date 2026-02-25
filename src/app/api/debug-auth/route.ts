import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        AUTH_SECRET: !!process.env.AUTH_SECRET,
        AUTH_SECRET_STARTS_WITH_QUOTE: process.env.AUTH_SECRET?.startsWith('"'),
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        AUTH_URL: process.env.AUTH_URL,
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        DATABASE_URL: !!process.env.DATABASE_URL,
    });
}
