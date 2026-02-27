import { describe, it, expect, vi, type MockedFunction } from "vitest";
import { requireAdmin } from "../admin-guard";

// Mock auth and next/navigation before importing the module under test
vi.mock("@/lib/auth", () => ({
    auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

vi.mock("next/server", () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({ body, status: init?.status ?? 200 })),
    },
}));

import { auth } from "@/lib/auth";

const mockAuth = auth as MockedFunction<typeof auth>;

describe("requireAdmin()", () => {
    it("returns 401 when there is no session", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const result = await requireAdmin();
        expect(result.session).toBeNull();
        expect(result.error).not.toBeNull();
        expect((result.error as { status: number }).status).toBe(401);
    });

    it("returns 401 when session has no user id", async () => {
        mockAuth.mockResolvedValueOnce({ user: {} } as never);
        const result = await requireAdmin();
        expect(result.session).toBeNull();
        expect((result.error as { status: number }).status).toBe(401);
    });

    it("returns 403 when session user is not an admin", async () => {
        mockAuth.mockResolvedValueOnce({
            user: { id: "user-123" },
            isAdmin: false,
        } as never);
        const result = await requireAdmin();
        expect(result.session).toBeNull();
        expect((result.error as { status: number }).status).toBe(403);
    });

    it("returns the session when user is an admin", async () => {
        const fakeSession = { user: { id: "admin-456" }, isAdmin: true };
        mockAuth.mockResolvedValueOnce(fakeSession as never);
        const result = await requireAdmin();
        expect(result.error).toBeNull();
        expect(result.session).toBe(fakeSession);
    });
});
