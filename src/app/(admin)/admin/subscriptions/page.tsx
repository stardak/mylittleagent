"use client";

import { useState } from "react";
import {
    CreditCard,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    RefreshCw,
    ArrowUpRight,
} from "lucide-react";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";

// Mock data — Stripe integration pending
const mrrHistory = [
    { month: "Sep", mrr: 870 }, { month: "Oct", mrr: 1160 },
    { month: "Nov", mrr: 1740 }, { month: "Dec", mrr: 1450 },
    { month: "Jan", mrr: 2030 }, { month: "Feb", mrr: 2610 },
];

const planDetails = [
    { name: "Trial", price: "Free", users: 12, pctOfTotal: 40, color: "bg-amber-500" },
    { name: "Pro", price: "£29/mo", users: 15, pctOfTotal: 50, color: "bg-indigo-500" },
    { name: "Business", price: "£79/mo", users: 3, pctOfTotal: 10, color: "bg-purple-500" },
];

const recentTransactions = [
    { id: "txn_001", user: "Sarah Johnson", email: "sarah@example.com", amount: 29, plan: "Pro", type: "payment", date: "2026-02-23" },
    { id: "txn_002", user: "Mike Williams", email: "mike@example.com", amount: 79, plan: "Business", type: "payment", date: "2026-02-22" },
    { id: "txn_003", user: "Emma Davis", email: "emma@example.com", amount: 29, plan: "Pro", type: "payment", date: "2026-02-21" },
    { id: "txn_004", user: "James Brown", email: "james@example.com", amount: 29, plan: "Pro", type: "refund", date: "2026-02-20" },
    { id: "txn_005", user: "Lisa Chen", email: "lisa@example.com", amount: 79, plan: "Business", type: "payment", date: "2026-02-19" },
];

const failedPayments = [
    { user: "Tom Baker", email: "tom@example.com", amount: 29, attempts: 3, lastAttempt: "2026-02-22", reason: "Card declined" },
    { user: "Kate Wilson", email: "kate@example.com", amount: 79, attempts: 1, lastAttempt: "2026-02-23", reason: "Insufficient funds" },
];

export default function AdminSubscriptionsPage() {
    const [timeRange, setTimeRange] = useState("6m");

    const totalMRR = mrrHistory[mrrHistory.length - 1].mrr;
    const prevMRR = mrrHistory[mrrHistory.length - 2].mrr;
    const mrrGrowth = Math.round(((totalMRR - prevMRR) / prevMRR) * 100);

    const stats = [
        { label: "MRR", value: `£${totalMRR.toLocaleString()}`, change: mrrGrowth, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
        { label: "Active Subscribers", value: "18", change: 12, icon: CreditCard, color: "bg-indigo-50 text-indigo-600" },
        { label: "Avg Revenue / User", value: `£${Math.round(totalMRR / 18)}`, change: 5, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
        { label: "Failed Payments", value: failedPayments.length.toString(), change: null, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Subscriptions & Revenue</h1>
                    <p className="text-sm text-gray-500 mt-1">Financial overview and subscription metrics</p>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Mock Data — Stripe Pending
                </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            {s.change != null && (
                                <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    <ArrowUpRight className="h-3 w-3" />
                                    {s.change}%
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* MRR Chart + Plan Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">MRR History</h2>
                    <p className="text-xs text-gray-500 mb-6">Monthly recurring revenue trend</p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mrrHistory}>
                                <defs>
                                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(value: any) => [`£${value}`, "MRR"]}
                                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fill="url(#mrrGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Plan Distribution</h2>
                    <div className="space-y-4">
                        {planDetails.map((plan) => (
                            <div key={plan.name}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">{plan.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">{plan.price}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{plan.users}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${plan.color} rounded-full`} style={{ width: `${plan.pctOfTotal}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">Estimated LTV</div>
                        <div className="text-xl font-bold text-gray-900 mt-1">£348</div>
                        <p className="text-xs text-gray-400 mt-1">Based on 12-month avg retention</p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentTransactions.map((txn) => (
                            <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-6 py-3.5">
                                    <div className="text-sm font-medium text-gray-900">{txn.user}</div>
                                    <div className="text-xs text-gray-500">{txn.email}</div>
                                </td>
                                <td className="px-6 py-3.5"><Badge variant="outline">{txn.plan}</Badge></td>
                                <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">£{txn.amount}</td>
                                <td className="px-6 py-3.5">
                                    <Badge variant="outline" className={txn.type === "payment" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                                        {txn.type}
                                    </Badge>
                                </td>
                                <td className="px-6 py-3.5 text-sm text-gray-500">{new Date(txn.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Failed Payments */}
            {failedPayments.length > 0 && (
                <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <h2 className="text-sm font-semibold text-red-900">Failed Payments ({failedPayments.length})</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {failedPayments.map((fp, i) => (
                            <div key={i} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{fp.user}</div>
                                    <div className="text-xs text-gray-500">{fp.email} · {fp.reason} · {fp.attempts} attempt{fp.attempts > 1 ? "s" : ""}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-900">£{fp.amount}</span>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
                                        <RefreshCw className="h-3 w-3" /> Retry
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
