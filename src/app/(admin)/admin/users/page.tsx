"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Loader2,
    ChevronDown,
    ChevronUp,
    Shield,
    Calendar,
    Mail,
    MoreHorizontal,
    Ban,
    Trash2,
    ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRow {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    lastLoginAt: string | null;
    isAdmin: boolean;
    workspace: {
        name: string;
        slug: string;
        plan: string;
        subscriptionStatus: string;
        trialEndsAt: string | null;
    } | null;
    discountCodes: string[];
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortField, setSortField] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (planFilter) params.set("plan", planFilter);
            params.set("page", String(page));

            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, [search, planFilter, page]);

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    };

    const sorted = [...users].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortField) {
            case "name": aVal = a.name; bVal = b.name; break;
            case "email": aVal = a.email; bVal = b.email; break;
            case "plan": aVal = a.workspace?.plan || ""; bVal = b.workspace?.plan || ""; break;
            case "lastLoginAt": aVal = a.lastLoginAt || ""; bVal = b.lastLoginAt || ""; break;
            default: aVal = a.createdAt; bVal = b.createdAt;
        }
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
    });

    const planColor = (plan: string) => {
        switch (plan) {
            case "pro": return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "business": return "bg-purple-50 text-purple-700 border-purple-200";
            case "trial": return "bg-amber-50 text-amber-700 border-amber-200";
            default: return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const SortHeader = ({ field, label }: { field: string; label: string }) => (
        <button
            onClick={() => toggleSort(field)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors"
        >
            {label}
            {sortField === field && (
                sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            )}
        </button>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {total} registered user{total !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
                    />
                </div>
                <select
                    value={planFilter}
                    onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">All Plans</option>
                    <option value="trial">Trial</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-20 text-sm text-gray-500">
                        No users found
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-3"><SortHeader field="name" label="Name" /></th>
                                <th className="text-left px-5 py-3"><SortHeader field="email" label="Email" /></th>
                                <th className="text-left px-5 py-3"><SortHeader field="createdAt" label="Joined" /></th>
                                <th className="text-left px-5 py-3"><SortHeader field="plan" label="Plan" /></th>
                                <th className="text-left px-5 py-3"><SortHeader field="lastLoginAt" label="Last Login" /></th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((user) => (
                                <>
                                    <tr
                                        key={user.id}
                                        onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                                                    {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                                    {user.isAdmin && (
                                                        <Shield className="inline h-3.5 w-3.5 text-indigo-500 ml-1.5" />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-5 py-3.5 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString("en-GB", {
                                                day: "numeric", month: "short", year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {user.workspace ? (
                                                <Badge variant="outline" className={planColor(user.workspace.plan)}>
                                                    {user.workspace.plan}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400">No workspace</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-500">
                                            {user.lastLoginAt
                                                ? new Date(user.lastLoginAt).toLocaleDateString("en-GB", {
                                                    day: "numeric", month: "short",
                                                })
                                                : "Never"}
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                        </td>
                                    </tr>
                                    {expandedId === user.id && (
                                        <tr key={`${user.id}-detail`}>
                                            <td colSpan={6} className="bg-gray-50/80 px-5 py-4 border-b border-gray-100">
                                                <div className="grid grid-cols-3 gap-6 text-sm">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                            Account Details
                                                        </h4>
                                                        <dl className="space-y-1.5">
                                                            <div className="flex justify-between">
                                                                <dt className="text-gray-500">User ID</dt>
                                                                <dd className="text-gray-700 font-mono text-xs">{user.id.slice(0, 12)}…</dd>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <dt className="text-gray-500">Workspace</dt>
                                                                <dd className="text-gray-700">{user.workspace?.name || "None"}</dd>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <dt className="text-gray-500">Status</dt>
                                                                <dd className="text-gray-700">{user.workspace?.subscriptionStatus || "N/A"}</dd>
                                                            </div>
                                                        </dl>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                            Contact
                                                        </h4>
                                                        <p className="text-gray-600">{user.email}</p>
                                                        {user.discountCodes.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-xs text-gray-500 mb-1">Discount codes used:</p>
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {user.discountCodes.map((c) => (
                                                                        <Badge key={c} variant="outline" className="text-xs">
                                                                            {c}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 mb-2">Actions</h4>
                                                        <div className="flex flex-col gap-2">
                                                            {user.workspace && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`/${user.workspace!.slug}/mediacard`, "_blank");
                                                                    }}
                                                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition w-fit"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" /> View Media Card
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition w-fit"
                                                            >
                                                                <Ban className="h-3 w-3" /> Suspend
                                                            </button>
                                                            <button
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition w-fit"
                                                            >
                                                                <Trash2 className="h-3 w-3" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page * 20 >= total}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
