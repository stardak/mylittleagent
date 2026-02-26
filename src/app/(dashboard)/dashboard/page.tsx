"use client";

import { useState, useEffect, useRef } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowUpRight,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    Plus,
    Sparkles,
    FileText,
    Mail,
    CheckCircle2,
    Clock,
    Bot,
    ArrowRight,
    Zap,
    Star,
    Target,
    Palette,
    BarChart3,
    Briefcase,
    CreditCard,
    Settings,
    Send,
    Loader2,
    Building2,
    Activity,
} from "lucide-react";

const quickActions = [
    { label: "New Brand Lead", icon: Plus, href: "/pipeline" },
    { label: "Create Pitch", icon: Sparkles, href: "/pipeline" },
    { label: "Generate Invoice", icon: FileText, href: "/invoices" },
    { label: "Log Outreach", icon: Mail, href: "/outreach" },
];

const setupStepsBase = [
    { name: "Brand Profile", completed: false, icon: Palette, xp: 15, description: "Name, niche, and positioning", href: "/onboarding" },
    { name: "Platforms", completed: false, icon: BarChart3, xp: 10, description: "Connect your social channels", href: "/onboarding" },
    { name: "Audience", completed: false, icon: Users, xp: 15, description: "Demographics & reach data", href: "/onboarding" },
    { name: "Past Work", completed: false, icon: Briefcase, xp: 20, description: "Showcase previous brand deals", href: "/onboarding" },
    { name: "Testimonials", completed: false, icon: Star, xp: 15, description: "Social proof from brands", href: "/onboarding" },
    { name: "Business Details", completed: false, icon: CreditCard, xp: 10, description: "Invoicing & payment info", href: "/settings?tab=business" },
    { name: "Rate Card", completed: false, icon: DollarSign, xp: 15, description: "Your pricing & packages", href: "/onboarding" },
    { name: "AI Manager", completed: false, icon: Bot, xp: 25, description: "Unlock AI-powered pitches", href: "/settings?tab=ai" },
    { name: "Email Setup", completed: false, icon: Mail, xp: 10, description: "Outreach templates", href: "/templates" },
];

const SUGGESTED_PROMPTS = [
    "What should I focus on today?",
    "Help me write a pitch for a Fashion brand",
    "What's a good follow-up email for a brand that hasn't replied?",
    "How should I price a YouTube integration deal?",
    "Draft a decline email for a brand that's not a good fit",
];

type ActivityItem = {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    brandName: string | null;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function activityIcon(type: string) {
    if (type.includes("brand")) return Building2;
    if (type.includes("outreach")) return Mail;
    if (type.includes("invoice")) return FileText;
    if (type.includes("campaign")) return Target;
    return Activity;
}

export default function DashboardPage() {
    const { workspaceName } = useWorkspace();
    const { data: session } = useSession();
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const [stepCompletion, setStepCompletion] = useState<Record<string, boolean>>({});
    const [stats, setStats] = useState({ pipelineValue: 0, activeBrands: 0, revenueMTD: 0, deliverablesDue: 0 });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/settings/api-key")
            .then((r) => r.json())
            .then((d) => setHasApiKey(d.hasKey))
            .catch(() => { });

        fetch("/api/setup-progress")
            .then((r) => r.json())
            .then((d) => { if (d.steps) setStepCompletion(d.steps); })
            .catch(() => { });

        fetch("/api/dashboard")
            .then((r) => r.json())
            .then((d) => {
                if (d.stats) setStats(d.stats);
                if (d.activities) setActivities(d.activities);
            })
            .catch(() => { })
            .finally(() => setActivityLoading(false));
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const sendChat = async (text: string) => {
        if (!text.trim() || chatLoading) return;
        const userMsg: ChatMessage = { role: "user", content: text };
        setChatMessages((prev) => [...prev, userMsg]);
        setChatInput("");
        setChatLoading(true);

        try {
            const res = await fetch("/api/agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...chatMessages, userMsg] }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setChatMessages((prev) => [...prev, {
                    role: "assistant",
                    content: err.error || "Something went wrong. Please check your API key in Settings → AI Manager.",
                }]);
                return;
            }

            // Stream response
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let assistantText = "";
            setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    // Parse AI SDK streaming format
                    const lines = chunk.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("0:")) {
                            try {
                                const text = JSON.parse(line.slice(2));
                                assistantText += text;
                                setChatMessages((prev) => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = { role: "assistant", content: assistantText };
                                    return updated;
                                });
                            } catch { /* skip */ }
                        }
                    }
                }
            }
        } catch {
            setChatMessages((prev) => [...prev, { role: "assistant", content: "Network error — please try again." }]);
        } finally {
            setChatLoading(false);
        }
    };

    const setupSteps = setupStepsBase.map((step) => ({ ...step, completed: stepCompletion[step.name] ?? false }));
    const completedSteps = setupSteps.filter((s) => s.completed).length;
    const progress = Math.round((completedSteps / setupSteps.length) * 100);
    const totalXP = setupSteps.reduce((sum, s) => sum + s.xp, 0);
    const earnedXP = setupSteps.filter((s) => s.completed).reduce((sum, s) => sum + s.xp, 0);
    const level = completedSteps <= 2 ? 1 : completedSteps <= 5 ? 2 : completedSteps <= 7 ? 3 : 4;
    const levelLabels = ["", "Newcomer", "Rising Star", "Pro Creator", "Elite Manager"];
    const motivationalText = progress === 0 ? "Complete your first step to start earning XP!"
        : progress < 40 ? "Great start! Keep going to unlock more AI features."
            : progress < 70 ? "You're on fire! Over halfway to a complete profile."
                : progress < 100 ? "Almost there! Just a few more to hit 100%."
                    : "Profile complete — you're getting the best AI results!";

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">
                        Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening with {workspaceName ?? "your workspace"} today.
                    </p>
                </div>
                <Link href="/pipeline">
                    <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                        <Plus className="h-4 w-4" />
                        New Brand Lead
                    </Button>
                </Link>
            </div>

            {/* API Key Banner */}
            {hasApiKey === false && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                    Set up your AI Manager to unlock pitch generation and your personal AI talent manager
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">Powered by your own Anthropic API key — typically £3-10/month</p>
                            </div>
                        </div>
                        <Link href="/settings?tab=ai">
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                                Add API Key <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Setup Progress */}
            {progress < 100 && (
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-brand/5 via-background to-purple-500/5">
                    <CardContent className="p-0">
                        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white text-lg font-heading font-bold shrink-0">
                                    {progress}%
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-heading font-semibold">Complete Your Profile</h3>
                                        <Badge className="bg-gradient-to-r from-brand to-purple-500 text-white text-[10px] px-2 py-0.5 border-0">
                                            Lv.{level} {levelLabels[level]}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">{motivationalText}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-brand">
                                    <Zap className="h-4 w-4" />
                                    <span className="text-lg font-heading font-bold">{earnedXP}</span>
                                    <span className="text-xs text-muted-foreground">/ {totalXP} XP</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-4">
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-3 rounded-full bg-gradient-to-r from-brand via-purple-500 to-brand transition-all duration-700 ease-out"
                                    style={{ width: `${Math.max(progress, 2)}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-xs text-muted-foreground">{completedSteps} of {setupSteps.length} steps</span>
                                <span className="text-xs font-semibold text-brand">{progress}%</span>
                            </div>
                        </div>
                        <div className="px-6 pb-6">
                            <div className="grid grid-cols-3 gap-2">
                                {setupSteps.map((step) => {
                                    const Icon = step.icon;
                                    return (
                                        <Link key={step.name} href={step.href}
                                            className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-md ${step.completed ? "bg-brand/5 border-brand/20" : "bg-background border-border hover:border-brand/30 hover:bg-brand/5"}`}
                                        >
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${step.completed ? "bg-brand/10" : "bg-muted group-hover:bg-brand/10"}`}>
                                                {step.completed ? <CheckCircle2 className="h-5 w-5 text-brand" /> : <Icon className="h-4 w-4 text-muted-foreground group-hover:text-brand transition-colors" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-medium truncate ${step.completed ? "text-brand" : "text-foreground"}`}>{step.name}</p>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${step.completed ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"}`}>+{step.xp} XP</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate">{step.description}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Pipeline Value", value: `£${stats.pipelineValue.toLocaleString()}`, icon: TrendingUp, color: "text-brand", bg: "bg-brand/10", sub: "Across all stages" },
                    { label: "Active Brands", value: stats.activeBrands, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", sub: "In pipeline" },
                    { label: "Revenue (MTD)", value: `£${stats.revenueMTD.toLocaleString()}`, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10", sub: "This month" },
                    { label: "Deliverables Due", value: stats.deliverablesDue, icon: Calendar, color: "text-rose-500", bg: "bg-rose-500/10", sub: "Next 7 days" },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{s.label}</p>
                                    <p className="text-2xl font-heading font-semibold mt-1">{s.value}</p>
                                </div>
                                <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3 text-green-500" />{s.sub}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main grid — AI Chat + Activity + Quick Actions */}
            <div className="grid grid-cols-3 gap-6">

                {/* AI Manager Chat — col-span-2 */}
                <Card className="col-span-2 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3 flex-row items-center gap-3 space-y-0">
                        <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                            <Sparkles className="h-4 w-4 text-brand" />
                        </div>
                        <div>
                            <CardTitle className="font-heading text-lg">Ask Your AI Manager</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">Powered by Claude — your personal talent manager</p>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 p-0 min-h-0">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3 max-h-72 min-h-[140px]">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-4 gap-4">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Ask anything about pitches, pricing, outreach, or what to do next.
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {SUGGESTED_PROMPTS.map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => sendChat(p)}
                                                className="text-xs px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 transition-colors"
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                                ? "bg-brand text-white rounded-br-sm"
                                                : "bg-muted text-foreground rounded-bl-sm"
                                            }`}>
                                            {msg.content || <Loader2 className="h-3.5 w-3.5 animate-spin opacity-50" />}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t px-4 py-3 flex gap-2">
                            <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat(chatInput)}
                                placeholder={hasApiKey === false ? "Add your API key in Settings to chat..." : "Ask your manager anything..."}
                                disabled={chatLoading || hasApiKey === false}
                                className="flex-1 text-sm"
                            />
                            <Button
                                onClick={() => sendChat(chatInput)}
                                disabled={chatLoading || !chatInput.trim() || hasApiKey === false}
                                className="bg-brand hover:bg-brand/90 text-white shrink-0"
                                size="icon"
                            >
                                {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {quickActions.map((action) => (
                            <Link key={action.label} href={action.href}>
                                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                                    <action.icon className="h-4 w-4 text-brand" />
                                    {action.label}
                                </Button>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {activityLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No activity yet. Add brands, send outreach, or create invoices to see activity here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {activities.map((a) => {
                                const Icon = activityIcon(a.type);
                                return (
                                    <div key={a.id} className="flex items-start gap-3 py-3">
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-snug">{a.description}</p>
                                            {a.brandName && (
                                                <p className="text-xs text-brand mt-0.5">{a.brandName}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
