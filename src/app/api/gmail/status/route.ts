import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const GMAIL_PROVIDER_ID = "google-gmail";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
        where: { userId: session.user.id, provider: GMAIL_PROVIDER_ID },
    });

    return NextResponse.json({
        connected: !!account?.refresh_token,
        email: account?.providerAccountId ?? null,
    });
}

export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.account.deleteMany({
        where: { userId: session.user.id, provider: GMAIL_PROVIDER_ID },
    });

    return NextResponse.json({ success: true });
}
