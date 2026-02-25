"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    AlertCircle,
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
} from "lucide-react";

const quickActions = [
    { label: "New Brand Lead", icon: Plus, href: "/pipeline" },
    { label: "Create Pitch", icon: Sparkles, href: "/pipeline" },
    { label: "Generate Invoice", icon: FileText, href: "/invoices" },
    { label: "Log Outreach", icon: Mail, href: "/pipeline" },
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

export default function DashboardPage() {
    const { workspaceName } = useWorkspace();
    const { data: session } = useSession();
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const [stepCompletion, setStepCompletion] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Fetch API key status for the banner
        fetch("/api/settings/api-key")
            .then((r) => r.json())
            .then((d) => setHasApiKey(d.hasKey))
            .catch(() => { });

        // Fetch real setup progress from the database
        fetch("/api/setup-progress")
            .then((r) => r.json())
            .then((d) => {
                if (d.steps) setStepCompletion(d.steps);
            })
            .catch(() => { });
    }, []);

    // Build setup steps with dynamic completion status from the API
    const setupSteps = setupStepsBase.map((step) => ({
        ...step,
        completed: stepCompletion[step.name] ?? false,
    }));

    const completedSteps = setupSteps.filter((s) => s.completed).length;
    const progress = Math.round((completedSteps / setupSteps.length) * 100);
    const totalXP = setupSteps.reduce((sum, s) => sum + s.xp, 0);
    const earnedXP = setupSteps.filter((s) => s.completed).reduce((sum, s) => sum + s.xp, 0);
    const level = completedSteps <= 2 ? 1 : completedSteps <= 5 ? 2 : completedSteps <= 7 ? 3 : 4;
    const levelLabels = ["", "Newcomer", "Rising Star", "Pro Creator", "Elite Manager"];

    const motivationalText = progress === 0
        ? "Complete your first step to start earning XP!"
        : progress < 40
            ? "Great start! Keep going to unlock more AI features."
            : progress < 70
                ? "You're on fire! Over halfway to a complete profile."
                : progress < 100
                    ? "Almost there! Just a few more to hit 100%."
                    : "Profile complete — you're getting the best AI results!";

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">
                        Welcome back
                        {session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
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

            {/* AI Manager API Key Banner */}
            {hasApiKey === false && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-900">
                                    Set up your AI Manager to unlock pitch generation, contract drafting, and your personal AI talent manager
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Powered by your own Anthropic API key — typically £3-10/month
                                </p>
                            </div>
                        </div>
                        <Link href="/settings?tab=ai">
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                                Add API Key
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Setup Progress (shown until complete) */}
            {progress < 100 && (
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-brand/5 via-background to-purple-500/5">
                    <CardContent className="p-0">
                        {/* Header Row */}
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

                        {/* Progress Bar */}
                        <div className="px-6 pb-4">
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-3 rounded-full bg-gradient-to-r from-brand via-purple-500 to-brand transition-all duration-700 ease-out relative"
                                    style={{ width: `${Math.max(progress, 2)}%` }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                                </div>
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-xs text-muted-foreground">{completedSteps} of {setupSteps.length} steps</span>
                                <span className="text-xs font-semibold text-brand">{progress}%</span>
                            </div>
                        </div>

                        {/* Steps Grid */}
                        <div className="px-6 pb-6">
                            <div className="grid grid-cols-3 gap-2">
                                {setupSteps.map((step) => {
                                    const Icon = step.icon;
                                    return (
                                        <Link
                                            key={step.name}
                                            href={step.href}
                                            className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-md ${step.completed
                                                ? "bg-brand/5 border-brand/20"
                                                : "bg-background border-border hover:border-brand/30 hover:bg-brand/5"
                                                }`}
                                        >
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${step.completed
                                                ? "bg-brand/10"
                                                : "bg-muted group-hover:bg-brand/10"
                                                }`}>
                                                {step.completed ? (
                                                    <CheckCircle2 className="h-5 w-5 text-brand" />
                                                ) : (
                                                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-brand transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-medium truncate ${step.completed ? "text-brand" : "text-foreground"
                                                        }`}>{step.name}</p>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${step.completed
                                                        ? "bg-brand/10 text-brand"
                                                        : "bg-muted text-muted-foreground"
                                                        }`}>
                                                        +{step.xp} XP
                                                    </span>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                                <p className="text-2xl font-heading font-semibold mt-1">£0</p>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-brand" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                            Across all stages
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Brands</p>
                                <p className="text-2xl font-heading font-semibold mt-1">0</p>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            In pipeline
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Revenue (MTD)</p>
                                <p className="text-2xl font-heading font-semibold mt-1">£0</p>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-amber-500" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            This month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Deliverables Due</p>
                                <p className="text-2xl font-heading font-semibold mt-1">0</p>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-rose-500" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            Next 7 days
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Action Items */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Action Items</CardTitle>
                        <CardDescription>
                            Tasks and follow-ups requiring your attention
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No action items yet. Start by adding brands to your pipeline.
                            </p>
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
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3 h-11"
                                >
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
                    <CardTitle className="font-heading text-lg">
                        Recent Activity
                    </CardTitle>
                    <CardDescription>
                        Your latest actions and updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Clock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No activity yet. Your recent actions will appear here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
