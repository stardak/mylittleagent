import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    let authError = null;
    try {
        // Try to initialize or check authConfig
        if (!authConfig.secret) authConfig.secret = process.env.AUTH_SECRET;
        if (!authConfig.providers?.length) throw new Error("No providers");
    } catch (e: any) {
        authError = e.message;
    }

    return NextResponse.json({
        AUTH_SECRET: !!process.env.AUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL,
        AUTH_URL: process.env.AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL,
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        DATABASE_URL: !!process.env.DATABASE_URL,
        VERCEL_URL: process.env.VERCEL_URL,
        authError,
    });
}
