"use client";

import { useState } from "react";
import {
    ScrollText,
    UserPlus,
    CreditCard,
    Settings,
    LogIn,
    Tag,
    FileText,
    Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EventType = "signup" | "login" | "subscription" | "settings" | "discount" | "content";

interface ActivityEvent {
    id: string;
    type: EventType;
    description: string;
    user: string;
    timestamp: string;
    metadata?: string;
}

const iconMap: Record<EventType, any> = {
    signup: UserPlus, login: LogIn, subscription: CreditCard,
    settings: Settings, discount: Tag, content: FileText,
};

const colorMap: Record<EventType, string> = {
    signup: "bg-green-50 text-green-600",
    login: "bg-blue-50 text-blue-600",
    subscription: "bg-indigo-50 text-indigo-600",
    settings: "bg-gray-100 text-gray-600",
    discount: "bg-amber-50 text-amber-600",
    content: "bg-purple-50 text-purple-600",
};

// Mock activity data
const mockEvents: ActivityEvent[] = [
    { id: "1", type: "signup", description: "New user registered", user: "emma@example.com", timestamp: "2026-02-24T09:15:00Z" },
    { id: "2", type: "login", description: "User logged in", user: "stefan@digital-farm.co.uk", timestamp: "2026-02-24T09:10:00Z" },
    { id: "3", type: "subscription", description: "Upgraded to Pro plan", user: "sarah@example.com", timestamp: "2026-02-24T08:45:00Z", metadata: "£29/mo" },
    { id: "4", type: "discount", description: "Discount code LAUNCH20 created", user: "admin", timestamp: "2026-02-24T08:30:00Z", metadata: "20% off" },
    { id: "5", type: "content", description: "Media card published", user: "stefan@digital-farm.co.uk", timestamp: "2026-02-24T08:00:00Z" },
    { id: "6", type: "settings", description: "Brand profile updated", user: "stefan@digital-farm.co.uk", timestamp: "2026-02-23T22:30:00Z" },
    { id: "7", type: "signup", description: "New user registered", user: "tom@example.com", timestamp: "2026-02-23T18:00:00Z" },
    { id: "8", type: "subscription", description: "Subscription cancelled", user: "mike@example.com", timestamp: "2026-02-23T15:20:00Z", metadata: "Reason: too expensive" },
    { id: "9", type: "login", description: "User logged in", user: "lisa@example.com", timestamp: "2026-02-23T14:00:00Z" },
    { id: "10", type: "content", description: "Campaign created: Summer Collection", user: "sarah@example.com", timestamp: "2026-02-23T11:30:00Z" },
];

export default function AdminActivityPage() {
    const [filterType, setFilterType] = useState<string>("");
    const [dateFilter, setDateFilter] = useState("7d");

    const filtered = mockEvents.filter((e) => !filterType || e.type === filterType);

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Activity Log</h1>
                <p className="text-sm text-gray-500 mt-1">Chronological feed of platform events</p>
            </div>

            <div className="flex items-center gap-3">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    <option value="">All Events</option>
                    <option value="signup">Signups</option>
                    <option value="login">Logins</option>
                    <option value="subscription">Subscriptions</option>
                    <option value="discount">Discounts</option>
                    <option value="content">Content</option>
                    <option value="settings">Settings</option>
                </select>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center text-sm text-gray-500">No events</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map((event) => {
                            const Icon = iconMap[event.type];
                            return (
                                <div key={event.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorMap[event.type]}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{event.description}</span>
                                            {event.metadata && (
                                                <Badge variant="outline" className="ml-2 text-xs">{event.metadata}</Badge>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{event.user}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">{formatTime(event.timestamp)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
