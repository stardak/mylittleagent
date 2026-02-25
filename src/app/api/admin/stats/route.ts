import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // Run all queries in parallel
        const [
            totalUsers,
            activeUsers,
            newThisWeek,
            newThisMonth,
            previousMonthSignups,
            workspacesByPlan,
            activeDiscounts,
            recentSignups,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
            prisma.workspace.groupBy({
                by: ["plan"],
                _count: true,
            }),
            prisma.discountCode.count({ where: { isActive: true } }),
            // Daily signups for last 30 days
            prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
                `SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
                 FROM "User"
                 WHERE "createdAt" >= $1
                 GROUP BY DATE("createdAt")
                 ORDER BY date ASC`,
                thirtyDaysAgo
            ),
        ]);

        // Process plan data
        const planCounts: Record<string, number> = {};
        for (const wp of workspacesByPlan) {
            planCounts[wp.plan] = wp._count;
        }
        const paidSubscribers = (planCounts["pro"] || 0) + (planCounts["business"] || 0);
        const freeUsers = planCounts["trial"] || 0;
        const conversionRate = totalUsers > 0 ? Math.round((paidSubscribers / totalUsers) * 100) : 0;

        // Mock MRR and churn (since no Stripe yet)
        const proMRR = (planCounts["pro"] || 0) * 29;
        const businessMRR = (planCounts["business"] || 0) * 79;
        const mrr = proMRR + businessMRR;

        const monthlyChange = previousMonthSignups > 0
            ? Math.round(((newThisMonth - previousMonthSignups) / previousMonthSignups) * 100)
            : 100;

        // Format signup chart data
        const signupChart = recentSignups.map((row) => ({
            date: typeof row.date === "string" ? row.date : new Date(row.date).toISOString().split("T")[0],
            signups: Number(row.count),
        }));

        return NextResponse.json({
            totalUsers,
            activeUsers,
            newThisWeek,
            newThisMonth,
            monthlyChange,
            paidSubscribers,
            freeUsers,
            mrr,
            churnRate: 2.1, // Mock - would come from Stripe
            activeDiscounts,
            conversionRate,
            signupChart,
            planBreakdown: planCounts,
        });
    } catch (err) {
        console.error("Admin stats error:", err);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
