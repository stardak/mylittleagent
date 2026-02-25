"use client";

import { useState, useMemo } from "react";
import {
    TrendingUp,
    Filter,
    Globe,
    Monitor,
    Smartphone,
    Tablet,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    FunnelChart,
    Funnel,
    LabelList,
} from "recharts";

// Mock data — will be replaced with real API when analytics tracking is added
const funnelData = [
    { name: "Visited Landing", value: 12400, fill: "#c7d2fe" },
    { name: "Clicked Sign Up", value: 3800, fill: "#a5b4fc" },
    { name: "Started Registration", value: 2100, fill: "#818cf8" },
    { name: "Completed Signup", value: 1650, fill: "#6366f1" },
    { name: "Completed Onboarding", value: 980, fill: "#4f46e5" },
    { name: "Active 7+ Days", value: 620, fill: "#4338ca" },
];

const monthlySignups = [
    { month: "Sep", signups: 42 }, { month: "Oct", signups: 68 },
    { month: "Nov", signups: 95 }, { month: "Dec", signups: 78 },
    { month: "Jan", signups: 124 }, { month: "Feb", signups: 156 },
];

const sourceData = [
    { source: "Google (Organic)", signups: 520, conv: "4.2%" },
    { source: "Direct", signups: 380, conv: "12.8%" },
    { source: "Twitter / X", signups: 245, conv: "3.1%" },
    { source: "Instagram", signups: 180, conv: "5.7%" },
    { source: "YouTube", signups: 165, conv: "8.4%" },
    { source: "Referral", signups: 110, conv: "22.5%" },
    { source: "TikTok", signups: 50, conv: "2.3%" },
];

const geoData = [
    { country: "🇬🇧 United Kingdom", pct: 45 },
    { country: "🇺🇸 United States", pct: 22 },
    { country: "🇦🇺 Australia", pct: 8 },
    { country: "🇨🇦 Canada", pct: 6 },
    { country: "🇩🇪 Germany", pct: 4 },
    { country: "🇫🇷 France", pct: 3 },
    { country: "Other", pct: 12 },
];

const deviceData = [
    { device: "Desktop", pct: 62, icon: Monitor },
    { device: "Mobile", pct: 31, icon: Smartphone },
    { device: "Tablet", pct: 7, icon: Tablet },
];

export default function AdminSignupsPage() {
    const [timeRange, setTimeRange] = useState("30d");

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Signups & Funnel</h1>
                    <p className="text-sm text-gray-500 mt-1">Acquisition analytics and conversion insights</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                </select>
            </div>

            {/* Funnel + Monthly Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Conversion Funnel</h2>
                    <p className="text-xs text-gray-500 mb-6">User journey from landing to activation</p>
                    <div className="space-y-3">
                        {funnelData.map((step, i) => {
                            const pct = Math.round((step.value / funnelData[0].value) * 100);
                            const dropoff = i > 0
                                ? Math.round(((funnelData[i - 1].value - step.value) / funnelData[i - 1].value) * 100)
                                : 0;
                            return (
                                <div key={step.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-700 font-medium">{step.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {step.value.toLocaleString()}
                                            </span>
                                            {i > 0 && (
                                                <span className="text-xs text-red-500 font-medium">
                                                    −{dropoff}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: step.fill,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Overall conversion</span>
                        <span className="font-semibold text-indigo-600 text-sm">
                            {Math.round((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100)}%
                        </span>
                    </div>
                </div>

                {/* Monthly Growth */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Monthly Signups</h2>
                    <p className="text-xs text-gray-500 mb-6">Growth trend over the last 6 months</p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlySignups}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: "#fff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                />
                                <Bar dataKey="signups" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Source + Geo + Device */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Source Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-1">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" /> Traffic Sources
                    </h2>
                    <div className="space-y-3">
                        {sourceData.map((s) => (
                            <div key={s.source} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{s.source}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-900">{s.signups}</span>
                                    <span className="text-xs text-green-600 font-medium w-10 text-right">{s.conv}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Geographic */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" /> Geography
                    </h2>
                    <div className="space-y-3">
                        {geoData.map((g) => (
                            <div key={g.country}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-700">{g.country}</span>
                                    <span className="text-sm font-semibold text-gray-900">{g.pct}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-400 rounded-full"
                                        style={{ width: `${g.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Device Breakdown</h2>
                    <div className="space-y-4">
                        {deviceData.map((d) => (
                            <div key={d.device} className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <d.icon className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{d.device}</span>
                                        <span className="text-sm font-bold text-gray-900">{d.pct}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${d.pct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
