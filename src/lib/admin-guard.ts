import { auth } from "@/lib/auth";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * Checks that the current session belongs to an admin user.
 * Returns the session if admin, or a 403 NextResponse if not.
 */
export async function requireAdmin() {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
    }

    if (!(session as any).isAdmin) {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
    }

    return { error: null, session };
}
