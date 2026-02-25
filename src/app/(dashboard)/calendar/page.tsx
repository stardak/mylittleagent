"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Youtube,
    Instagram,
    Play,
    Globe,
    Filter,
    Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface CalendarDeliverable {
    id: string;
    type: string;
    platform: string;
    status: string;
    assignedTo: string | null;
    dueDate: string | null;
    publishDate: string | null;
    campaign: {
        id: string;
        name: string;
        status: string;
        brand: { id: string; name: string };
    };
}

// ── Constants ──────────────────────────────────────────────────
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const PLATFORM_COLORS: Record<string, string> = {
    youtube: "bg-red-100 text-red-700 border-red-200",
    instagram: "bg-pink-100 text-pink-700 border-pink-200",
    tiktok: "bg-slate-100 text-slate-800 border-slate-200",
    "twitter/x": "bg-sky-100 text-sky-700 border-sky-200",
    blog: "bg-amber-100 text-amber-700 border-amber-200",
    "brand channels": "bg-purple-100 text-purple-700 border-purple-200",
    other: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_DOTS: Record<string, string> = {
    not_started: "bg-slate-400",
    in_progress: "bg-blue-500",
    draft_ready: "bg-indigo-500",
    in_review: "bg-amber-500",
    revision_requested: "bg-orange-500",
    approved: "bg-emerald-500",
    scheduled: "bg-cyan-500",
    published: "bg-green-500",
};

// ── Helpers ────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function PlatformIcon({ platform, className = "h-3 w-3" }: { platform: string; className?: string }) {
    switch (platform.toLowerCase()) {
        case "youtube":
            return <Youtube className={`${className} text-red-600`} />;
        case "instagram":
            return <Instagram className={`${className} text-pink-600`} />;
        case "tiktok":
            return <Play className={`${className} text-slate-800`} />;
        default:
            return <Globe className={`${className} text-slate-500`} />;
    }
}

// ── Main Component ─────────────────────────────────────────────
export default function CalendarPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
    const [deliverables, setDeliverables] = useState<CalendarDeliverable[]>([]);
    const [loading, setLoading] = useState(true);
    const [platformFilter, setPlatformFilter] = useState("all");

    // Fetch deliverables for the visible month range
    const fetchDeliverables = useCallback(async () => {
        setLoading(true);
        try {
            // Get the first and last day visible in the calendar
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            // Expand range slightly to capture edge cases
            startDate.setDate(startDate.getDate() - 7);
            endDate.setDate(endDate.getDate() + 7);

            const params = new URLSearchParams({
                dueAfter: startDate.toISOString(),
                dueBefore: endDate.toISOString(),
            });

            if (platformFilter && platformFilter !== "all") {
                params.set("platform", platformFilter);
            }

            const res = await fetch(`/api/deliverables?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch deliverables");
            const data = await res.json();
            setDeliverables(data);
        } catch {
            // silently fail — empty calendar is fine
        } finally {
            setLoading(false);
        }
    }, [year, month, platformFilter]);

    useEffect(() => {
        fetchDeliverables();
    }, [fetchDeliverables]);

    // Navigation
    const goToPrevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const goToNextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const goToToday = () => {
        setYear(now.getFullYear());
        setMonth(now.getMonth());
    };

    // Calendar grid
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < totalCells; i++) {
        const dayNumber = i - firstDay + 1;
        calendarCells.push(dayNumber >= 1 && dayNumber <= daysInMonth ? dayNumber : null);
    }
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
        weeks.push(calendarCells.slice(i, i + 7));
    }

    const isToday = (day: number | null) => {
        if (!day) return false;
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    };

    // Get deliverables for a specific day
    const getDeliverablesForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return deliverables.filter((d) => {
            if (!d.dueDate) return false;
            return d.dueDate.slice(0, 10) === dateStr;
        });
    };

    const platformColor = (platform: string) =>
        PLATFORM_COLORS[platform.toLowerCase()] || PLATFORM_COLORS.other;

    const statusDot = (status: string) =>
        STATUS_DOTS[status] || STATUS_DOTS.not_started;

    // Unique platforms for filter
    const platforms = ["YouTube", "Instagram", "TikTok", "Twitter/X", "Blog", "Brand Channels", "Other"];

    return (
        <TooltipProvider>
            <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-heading font-semibold">Content Calendar</h1>
                        <p className="text-muted-foreground mt-1">
                            All your deliverables across campaigns in one view.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Platform filter */}
                        <Select value={platformFilter} onValueChange={setPlatformFilter}>
                            <SelectTrigger className="w-40">
                                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Platforms</SelectItem>
                                {platforms.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Month navigation */}
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="px-4 min-w-[160px]"
                                onClick={goToToday}
                            >
                                {MONTH_NAMES[month]} {year}
                            </Button>
                            <Button variant="outline" size="icon" onClick={goToNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* View mode */}
                        <div className="flex border rounded-lg overflow-hidden">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-none text-xs ${viewMode === "month" ? "bg-accent" : ""}`}
                                onClick={() => setViewMode("month")}
                            >
                                Month
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-none text-xs ${viewMode === "week" ? "bg-accent" : ""}`}
                                onClick={() => setViewMode("week")}
                            >
                                Week
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-none text-xs ${viewMode === "day" ? "bg-accent" : ""}`}
                                onClick={() => setViewMode("day")}
                            >
                                Day
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Platform legend */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">Platforms:</span>
                    {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
                        <span
                            key={platform}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${color}`}
                        >
                            <PlatformIcon platform={platform} className="h-3 w-3" />
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading deliverables...
                    </div>
                )}

                {/* Calendar Grid */}
                <Card>
                    <CardContent className="p-0">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b">
                            {dayLabels.map((day) => (
                                <div
                                    key={day}
                                    className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Weeks */}
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                                {week.map((day, dayIndex) => {
                                    const dayDeliverables = day ? getDeliverablesForDay(day) : [];
                                    const isPastDue = day && dayDeliverables.some(
                                        (d) => d.status !== "published" && new Date(year, month, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate())
                                    );

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`min-h-[110px] p-2 border-r last:border-r-0 transition-colors ${day ? "hover:bg-accent/30" : "bg-muted/20"
                                                } ${isPastDue ? "bg-red-50/50" : ""}`}
                                        >
                                            {day && (
                                                <>
                                                    <span
                                                        className={`text-sm inline-flex h-7 w-7 items-center justify-center rounded-full mb-1 ${isToday(day)
                                                                ? "bg-brand text-white font-medium"
                                                                : "text-muted-foreground"
                                                            }`}
                                                    >
                                                        {day}
                                                    </span>
                                                    {/* Deliverable chips */}
                                                    <div className="space-y-1">
                                                        {dayDeliverables.slice(0, 3).map((d) => (
                                                            <Tooltip key={d.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer truncate ${platformColor(d.platform)}`}
                                                                    >
                                                                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot(d.status)}`} />
                                                                        <PlatformIcon platform={d.platform} className="h-2.5 w-2.5 shrink-0" />
                                                                        <span className="truncate">{d.type}</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="bottom" className="max-w-xs">
                                                                    <div className="space-y-1">
                                                                        <p className="font-medium text-xs">{d.type} — {d.platform}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {d.campaign.brand.name} · {d.campaign.name}
                                                                        </p>
                                                                        <p className="text-xs">
                                                                            Status: {d.status.replace(/_/g, " ")}
                                                                            {d.assignedTo && ` · ${d.assignedTo}`}
                                                                        </p>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                        {dayDeliverables.length > 3 && (
                                                            <span className="text-[10px] text-muted-foreground pl-1">
                                                                +{dayDeliverables.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
