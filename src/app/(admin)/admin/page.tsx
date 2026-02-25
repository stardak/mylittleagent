"use client";

import { useState, useEffect } from "react";
import {
    Users,
    UserCheck,
    UserPlus,
    CreditCard,
    DollarSign,
    TrendingDown,
    Tag,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface Stats {
    totalUsers: number;
    activeUsers: number;
    newThisWeek: number;
    newThisMonth: number;
    monthlyChange: number;
    paidSubscribers: number;
    freeUsers: number;
    mrr: number;
    churnRate: number;
    activeDiscounts: number;
    conversionRate: number;
    signupChart: { date: string; signups: number }[];
    planBreakdown: Record<string, number>;
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then((r) => r.json())
            .then((d) => setStats(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 text-center text-gray-500">Failed to load stats</div>
        );
    }

    const statCards = [
        {
            label: "Total Signups",
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            color: "bg-blue-50 text-blue-600",
            iconColor: "text-blue-500",
        },
        {
            label: "Active Users",
            value: stats.activeUsers.toLocaleString(),
            subtext: "Last 30 days",
            icon: UserCheck,
            color: "bg-green-50 text-green-600",
            iconColor: "text-green-500",
        },
        {
            label: "New This Month",
            value: stats.newThisMonth.toLocaleString(),
            change: stats.monthlyChange,
            icon: UserPlus,
            color: "bg-purple-50 text-purple-600",
            iconColor: "text-purple-500",
        },
        {
            label: "Paid Subscribers",
            value: stats.paidSubscribers.toLocaleString(),
            icon: CreditCard,
            color: "bg-indigo-50 text-indigo-600",
            iconColor: "text-indigo-500",
        },
        {
            label: "MRR",
            value: `£${stats.mrr.toLocaleString()}`,
            icon: DollarSign,
            color: "bg-emerald-50 text-emerald-600",
            iconColor: "text-emerald-500",
        },
        {
            label: "Churn Rate",
            value: `${stats.churnRate}%`,
            icon: TrendingDown,
            color: "bg-red-50 text-red-600",
            iconColor: "text-red-500",
        },
        {
            label: "Active Discounts",
            value: stats.activeDiscounts.toLocaleString(),
            icon: Tag,
            color: "bg-amber-50 text-amber-600",
            iconColor: "text-amber-500",
        },
        {
            label: "Conversion Rate",
            value: `${stats.conversionRate}%`,
            subtext: "Free → Paid",
            icon: ArrowUpRight,
            color: "bg-teal-50 text-teal-600",
            iconColor: "text-teal-500",
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Platform overview and key metrics
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className={`h-10 w-10 rounded-lg flex items-center justify-center ${card.color}`}
                            >
                                <card.icon className="h-5 w-5" />
                            </div>
                            {card.change != null && (
                                <span
                                    className={`text-xs font-semibold flex items-center gap-0.5 ${card.change >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {card.change >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3" />
                                    )}
                                    {Math.abs(card.change)}%
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {card.value}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {card.label}
                            {card.subtext && (
                                <span className="text-gray-400 ml-1">
                                    · {card.subtext}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Signups Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                    Signups Over Time
                </h2>
                <p className="text-xs text-gray-500 mb-6">Daily new user registrations — last 30 days</p>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.signupChart}>
                            <defs>
                                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(v) => {
                                    const d = new Date(v);
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                axisLine={{ stroke: "#e2e8f0" }}
                                tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString("en-GB", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                })}
                            />
                            <Area
                                type="monotone"
                                dataKey="signups"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#signupGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Plan Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                    <div
                        key={plan}
                        className="bg-white rounded-xl border border-gray-200 p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                    {plan} Plan
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {count}
                                </p>
                            </div>
                            <div className="text-xs text-gray-400">
                                {stats.totalUsers > 0
                                    ? Math.round(((count as number) / stats.totalUsers) * 100)
                                    : 0}
                                % of users
                            </div>
                        </div>
                        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{
                                    width: `${stats.totalUsers > 0
                                            ? ((count as number) / stats.totalUsers) * 100
                                            : 0
                                        }%`,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
