"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Tag,
    Plus,
    Search,
    Loader2,
    Pencil,
    Trash2,
    Pause,
    Play,
    X,
    Copy,
    Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DiscountCode {
    id: string;
    code: string;
    type: string;
    value: number;
    appliesTo: string[];
    duration: string;
    durationMonths: number | null;
    maxRedemptions: number | null;
    perUserLimit: number;
    expiresAt: string | null;
    isActive: boolean;
    timesUsed: number;
    createdAt: string;
}

const emptyForm = {
    code: "",
    type: "percentage",
    value: "",
    duration: "first_month",
    durationMonths: "",
    maxRedemptions: "",
    perUserLimit: "1",
    expiresAt: "",
};

export default function AdminDiscountsPage() {
    const [codes, setCodes] = useState<DiscountCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchCodes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/discounts?${params}`);
            const data = await res.json();
            setCodes(data.codes || []);
        } catch {
            console.error("Failed to fetch discounts");
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(fetchCodes, 300);
        return () => clearTimeout(timer);
    }, [fetchCodes]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/admin/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Failed to create");
                return;
            }
            toast.success("Discount code created");
            setShowCreate(false);
            setForm(emptyForm);
            fetchCodes();
        } catch {
            toast.error("Failed to create");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            await fetch(`/api/admin/discounts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive }),
            });
            toast.success(isActive ? "Code paused" : "Code activated");
            fetchCodes();
        } catch {
            toast.error("Failed to update");
        }
    };

    const deleteCode = async (id: string) => {
        if (!confirm("Delete this discount code?")) return;
        try {
            await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
            toast.success("Code deleted");
            fetchCodes();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDiscount = (type: string, value: number) => {
        return type === "percentage" ? `${value}%` : `£${value}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Discount Codes</h1>
                    <p className="text-sm text-gray-500 mt-1">{codes.length} code{codes.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
                >
                    <Plus className="h-4 w-4" /> New Code
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search codes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
                />
            </div>

            {/* Create Dialog */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Create Discount Code</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Code</label>
                                <input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. LAUNCH20"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed (£)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Value</label>
                                    <input
                                        type="number"
                                        value={form.value}
                                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                                        placeholder={form.type === "percentage" ? "20" : "10"}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Duration</label>
                                    <select
                                        value={form.duration}
                                        onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="first_month">First Month</option>
                                        <option value="months">Multiple Months</option>
                                        <option value="lifetime">Lifetime</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Max Uses</label>
                                    <input
                                        type="number"
                                        value={form.maxRedemptions}
                                        onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                                        placeholder="Unlimited"
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    value={form.expiresAt}
                                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {saving ? "Creating…" : "Create Code"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : codes.length === 0 ? (
                    <div className="text-center py-20">
                        <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No discount codes yet</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800"
                        >
                            Create your first code →
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Redemptions</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                                <th className="w-32" />
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map((code) => (
                                <tr key={code.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-semibold font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                                {code.code}
                                            </code>
                                            <button
                                                onClick={() => copyCode(code.code, code.id)}
                                                className="p-1 hover:bg-gray-100 rounded transition"
                                            >
                                                {copiedId === code.id
                                                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                                                    : <Copy className="h-3.5 w-3.5 text-gray-400" />
                                                }
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-sm font-semibold text-indigo-600">
                                            {formatDiscount(code.type, code.value)} off
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">
                                        {code.duration.replace("_", " ")}
                                        {code.durationMonths ? ` (${code.durationMonths}mo)` : ""}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-gray-600">
                                        {code.timesUsed}
                                        {code.maxRedemptions ? ` / ${code.maxRedemptions}` : ""}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Badge
                                            variant="outline"
                                            className={
                                                code.isActive
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                            }
                                        >
                                            {code.isActive ? "Active" : "Paused"}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-gray-500">
                                        {code.expiresAt
                                            ? new Date(code.expiresAt).toLocaleDateString("en-GB", {
                                                day: "numeric", month: "short", year: "numeric",
                                            })
                                            : "Never"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => toggleActive(code.id, code.isActive)}
                                                className={`p-1.5 rounded-lg transition ${code.isActive
                                                        ? "hover:bg-amber-50 text-amber-600"
                                                        : "hover:bg-green-50 text-green-600"
                                                    }`}
                                                title={code.isActive ? "Pause" : "Activate"}
                                            >
                                                {code.isActive
                                                    ? <Pause className="h-3.5 w-3.5" />
                                                    : <Play className="h-3.5 w-3.5" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => deleteCode(code.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
