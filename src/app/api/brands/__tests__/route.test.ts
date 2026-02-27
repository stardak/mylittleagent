import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { GET, POST } from "../route";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
    default: {
        membership: { findFirst: vi.fn() },
        brand: { findMany: vi.fn(), create: vi.fn() },
        activity: { create: vi.fn() },
    },
}));
vi.mock("next/server", () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({
            body,
            status: init?.status ?? 200,
            json: async () => body,
        })),
    },
}));

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const mockAuth = auth as MockedFunction<typeof auth>;
const mockMembership = prisma.membership.findFirst as MockedFunction<typeof prisma.membership.findFirst>;
const mockBrandFindMany = prisma.brand.findMany as MockedFunction<typeof prisma.brand.findMany>;
const mockBrandCreate = prisma.brand.create as MockedFunction<typeof prisma.brand.create>;
const mockActivityCreate = prisma.activity.create as MockedFunction<typeof prisma.activity.create>;

// Helper to build a minimal Request
function makeRequest(path: string, opts?: RequestInit) {
    return new Request(`http://localhost${path}`, opts);
}

// ── Test data ─────────────────────────────────────────────────────────────────

const SESSION = { user: { id: "user-1" } };
const WORKSPACE_ID = "ws-1";
const MEMBERSHIP = { workspaceId: WORKSPACE_ID };

// ── GET /api/brands ───────────────────────────────────────────────────────────

describe("GET /api/brands", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const res = await GET(makeRequest("/api/brands"));
        expect((res as { status: number }).status).toBe(401);
    });

    it("returns 401 when membership not found", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(null);
        const res = await GET(makeRequest("/api/brands"));
        expect((res as { status: number }).status).toBe(401);
    });

    it("queries brands with workspaceId filter", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindMany.mockResolvedValueOnce([]);

        await GET(makeRequest("/api/brands"));

        expect(mockBrandFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ workspaceId: WORKSPACE_ID }),
            })
        );
    });

    it("applies search param to OR filter", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindMany.mockResolvedValueOnce([]);

        await GET(makeRequest("/api/brands?search=apple"));

        const call = mockBrandFindMany.mock.calls[0][0];
        expect(call.where.OR).toBeDefined();
    });

    it("applies stage filter", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindMany.mockResolvedValueOnce([]);

        await GET(makeRequest("/api/brands?stage=research"));

        const call = mockBrandFindMany.mock.calls[0][0];
        expect(call.where.pipelineStage).toBe("research");
    });

    it("returns brands as JSON", async () => {
        const fakeBrands = [{ id: "b-1", name: "Acme" }];
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindMany.mockResolvedValueOnce(fakeBrands as never);

        const res = await GET(makeRequest("/api/brands"));
        expect((res as { body: unknown }).body).toEqual(fakeBrands);
    });
});

// ── POST /api/brands ──────────────────────────────────────────────────────────

describe("POST /api/brands", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const req = makeRequest("/api/brands", {
            method: "POST",
            body: JSON.stringify({ name: "Acme" }),
        });
        const res = await POST(req);
        expect((res as { status: number }).status).toBe(401);
    });

    it("creates a brand and logs activity on success", async () => {
        mockAuth.mockResolvedValue(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);

        const newBrand = { id: "b-2", name: "Acme", workspaceId: WORKSPACE_ID };
        mockBrandCreate.mockResolvedValueOnce(newBrand as never);
        mockActivityCreate.mockResolvedValueOnce({} as never);

        const req = makeRequest("/api/brands", {
            method: "POST",
            body: JSON.stringify({ name: "Acme", pipelineStage: "research" }),
        });
        const res = await POST(req);

        expect(mockBrandCreate).toHaveBeenCalledOnce();
        expect(mockActivityCreate).toHaveBeenCalledOnce();
        expect((res as { status: number }).status).toBe(201);
    });
});
