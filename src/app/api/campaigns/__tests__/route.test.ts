import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { GET, POST } from "../route";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
    default: {
        membership: { findFirst: vi.fn() },
        brand: { findFirst: vi.fn() },
        campaign: { findMany: vi.fn(), create: vi.fn() },
        activity: { create: vi.fn() },
    },
}));
vi.mock("next/server", () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({
            body,
            status: init?.status ?? 200,
        })),
    },
}));

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const mockAuth = auth as MockedFunction<typeof auth>;
const mockMembership = prisma.membership.findFirst as MockedFunction<typeof prisma.membership.findFirst>;
const mockBrandFindFirst = prisma.brand.findFirst as MockedFunction<typeof prisma.brand.findFirst>;
const mockCampaignFindMany = prisma.campaign.findMany as MockedFunction<typeof prisma.campaign.findMany>;
const mockCampaignCreate = prisma.campaign.create as MockedFunction<typeof prisma.campaign.create>;
const mockActivityCreate = prisma.activity.create as MockedFunction<typeof prisma.activity.create>;

function makeRequest(url: string, opts?: RequestInit) {
    return new Request(`http://localhost${url}`, opts);
}

const SESSION = { user: { id: "user-1" } };
const WORKSPACE_ID = "ws-1";
const MEMBERSHIP = { workspaceId: WORKSPACE_ID };

// ── GET /api/campaigns ────────────────────────────────────────────────────────

describe("GET /api/campaigns", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns 401 when unauthenticated", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const res = await GET(makeRequest("/api/campaigns"));
        expect((res as { status: number }).status).toBe(401);
    });

    it("queries campaigns with workspace filter", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockCampaignFindMany.mockResolvedValueOnce([]);

        await GET(makeRequest("/api/campaigns"));

        expect(mockCampaignFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ workspaceId: WORKSPACE_ID }),
            })
        );
    });

    it("applies brandId filter when provided", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockCampaignFindMany.mockResolvedValueOnce([]);

        await GET(makeRequest("/api/campaigns?brandId=b-1"));

        const call = mockCampaignFindMany.mock.calls[0][0];
        expect(call.where.brandId).toBe("b-1");
    });

    it("applies status filter when provided", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockCampaignFindMany.mockResolvedValueOnce([]);

        await GET(makeRequest("/api/campaigns?status=active"));

        const call = mockCampaignFindMany.mock.calls[0][0];
        expect(call.where.status).toBe("active");
    });

    it("applies search OR filter when provided", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockCampaignFindMany.mockResolvedValueOnce([]);

        await GET(makeRequest("/api/campaigns?search=summer"));

        const call = mockCampaignFindMany.mock.calls[0][0];
        expect(call.where.OR).toBeDefined();
    });
});

// ── POST /api/campaigns ───────────────────────────────────────────────────────

describe("POST /api/campaigns", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns 401 when unauthenticated", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const res = await POST(
            makeRequest("/api/campaigns", { method: "POST", body: JSON.stringify({}) })
        );
        expect((res as { status: number }).status).toBe(401);
    });

    it("returns 400 when name is missing", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        const res = await POST(
            makeRequest("/api/campaigns", {
                method: "POST",
                body: JSON.stringify({ brandId: "b-1" }),
            })
        );
        expect((res as { status: number }).status).toBe(400);
    });

    it("returns 400 when brandId is missing", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        const res = await POST(
            makeRequest("/api/campaigns", {
                method: "POST",
                body: JSON.stringify({ name: "Q1 Campaign" }),
            })
        );
        expect((res as { status: number }).status).toBe(400);
    });

    it("returns 404 when brand not found in workspace", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindFirst.mockResolvedValueOnce(null);

        const res = await POST(
            makeRequest("/api/campaigns", {
                method: "POST",
                body: JSON.stringify({ name: "Q1 Campaign", brandId: "nonexistent" }),
            })
        );
        expect((res as { status: number }).status).toBe(404);
    });

    it("creates a campaign and logs activity on success", async () => {
        const fakeBrand = { id: "b-1", name: "Acme" };
        const fakeCampaign = {
            id: "c-1",
            name: "Q1 Campaign",
            workspaceId: WORKSPACE_ID,
            brand: fakeBrand,
            _count: { deliverables: 0, invoices: 0, tasks: 0 },
        };

        mockAuth.mockResolvedValue(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindFirst.mockResolvedValueOnce(fakeBrand as never);
        mockCampaignCreate.mockResolvedValueOnce(fakeCampaign as never);
        mockActivityCreate.mockResolvedValueOnce({} as never);

        const res = await POST(
            makeRequest("/api/campaigns", {
                method: "POST",
                body: JSON.stringify({ name: "Q1 Campaign", brandId: "b-1" }),
            })
        );

        expect(mockCampaignCreate).toHaveBeenCalledOnce();
        expect(mockActivityCreate).toHaveBeenCalledOnce();
        expect((res as { status: number }).status).toBe(201);
    });
});
