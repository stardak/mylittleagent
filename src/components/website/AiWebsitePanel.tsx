"use client";

/**
 * AiWebsitePanel — slide-over panel for AI-powered website copy generation.
 * - Locked state: shown when < 5 onboarding steps complete (or no API key)
 * - Active state: chat-like interface to generate/refine website copy
 */

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
    X,
    Sparkles,
    Loader2,
    Lock,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Suggestion {
    heroHeadline?: string;
    heroTagline?: string;
    heroSubtext?: string;
    aboutText?: string;
    servicesHeadline?: string;
    statsHeadline?: string;
    workHeadline?: string;
    testimonialsHeadline?: string;
    seoTitle?: string;
    seoDescription?: string;
    sectionOrder?: string[];
    themeRecommendation?: { note: string };
}

const INCOMPLETE_STEP_HREFS: Record<string, string> = {
    "Brand Profile": "/onboarding",
    "Platforms": "/onboarding",
    "Audience": "/onboarding",
    "Past Work": "/onboarding",
    "Testimonials": "/onboarding",
    "Business Details": "/onboarding",
    "Rate Card": "/onboarding",
    "AI Manager": "/settings?tab=ai",
    "Email Setup": "/settings?tab=integrations",
};

interface Props {
    onClose: () => void;
    onApplySuggestions: (suggestions: Record<string, string>) => Promise<void>;
    websiteSlug: string;
}

const SUGGESTION_LABELS: Record<keyof Suggestion, string> = {
    heroHeadline: "Hero Headline",
    heroTagline: "Hero Tagline",
    heroSubtext: "Hero Subtext",
    aboutText: "About Text",
    servicesHeadline: "Services Headline",
    statsHeadline: "Stats Headline",
    workHeadline: "Work Headline",
    testimonialsHeadline: "Testimonials Headline",
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    sectionOrder: "Section Order",
    themeRecommendation: "Theme Note",
};

export function AiWebsitePanel({ onClose, onApplySuggestions }: Props) {
    const [status, setStatus] = useState<"loading" | "locked" | "active">("loading");
    const [lockInfo, setLockInfo] = useState<{
        completedSteps?: number;
        requiredSteps?: number;
        incompleteSteps?: string[];
        reason?: string;
    }>({});
    const [instruction, setInstruction] = useState("");
    const [generating, setGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
    const [streamText, setStreamText] = useState("");
    const [applied, setApplied] = useState<Record<string, boolean>>({});
    const [applying, setApplying] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Check lock status by making a dry-run request
        fetch("/api/ai/website-suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instruction: "__CHECK__" }),
        }).then(async (res) => {
            if (res.status === 422) {
                const data = await res.json();
                if (data.locked) {
                    setLockInfo(data);
                    setStatus("locked");
                    return;
                }
            }
            // Any other response (including 200) means we're active
            setStatus("active");
        }).catch(() => setStatus("active"));
    }, []);

    const generate = async (inst?: string) => {
        const userInstruction = inst ?? (instruction.trim() || "Generate website copy for all sections");
        setGenerating(true);
        setSuggestions(null);
        setStreamText("");
        setApplied({});

        try {
            const res = await fetch("/api/ai/website-suggestions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instruction: userInstruction }),
            });

            if (res.status === 422) {
                const data = await res.json();
                if (data.locked) {
                    setLockInfo(data);
                    setStatus("locked");
                    setGenerating(false);
                    return;
                }
            }

            if (!res.ok || !res.body) {
                toast.error("AI generation failed");
                setGenerating(false);
                return;
            }

            // Read stream
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let full = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                full += chunk;
                setStreamText(full);
            }

            // Try to parse JSON from the full stream
            const jsonMatch = full.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]) as Suggestion;
                    setSuggestions(parsed);
                    setStreamText("");
                } catch {
                    // Couldn't parse — show raw stream
                }
            }
        } catch {
            toast.error("Generation failed. Check your API key.");
        } finally {
            setGenerating(false);
        }
    };

    const applySuggestion = async (key: keyof Suggestion) => {
        if (!suggestions || applied[key as string]) return;
        setApplying(true);
        try {
            await onApplySuggestions({ [key]: suggestions[key] as string });
            setApplied((prev) => ({ ...prev, [key as string]: true }));
            toast.success(`Applied: ${SUGGESTION_LABELS[key]}`);
        } catch {
            toast.error("Failed to apply suggestion");
        } finally {
            setApplying(false);
        }
    };

    const applyAll = async () => {
        if (!suggestions) return;
        setApplying(true);
        try {
            await onApplySuggestions(suggestions as Record<string, string>);
            const allApplied: Record<string, boolean> = {};
            Object.keys(suggestions).forEach((k) => { allApplied[k] = true; });
            setApplied(allApplied);
            toast.success("All suggestions applied! ✨");
        } catch {
            toast.error("Failed to apply suggestions");
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="flex-1 bg-black/40" onClick={onClose} />

            {/* Panel */}
            <div className="w-[420px] h-full bg-sidebar border-l shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b bg-gradient-to-r from-brand/5 to-transparent">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-brand" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-heading font-semibold">AI Website Builder</h2>
                        <p className="text-xs text-muted-foreground">Powered by your brand profile</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {status === "loading" && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* ── LOCKED STATE ── */}
                    {status === "locked" && (
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col items-center text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Lock className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-heading font-semibold text-lg mb-2">Complete your profile first</h3>
                                <p className="text-sm text-muted-foreground">
                                    {lockInfo.reason ?? `The AI needs ${lockInfo.requiredSteps ?? 5} setup steps completed to understand your brand.`}
                                </p>
                            </div>

                            {/* Progress bar */}
                            {lockInfo.completedSteps !== undefined && lockInfo.requiredSteps !== undefined && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{lockInfo.completedSteps} of {lockInfo.requiredSteps} steps done</span>
                                        <span className="text-muted-foreground">{Math.round((lockInfo.completedSteps / lockInfo.requiredSteps) * 100)}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((lockInfo.completedSteps / lockInfo.requiredSteps) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Missing steps */}
                            {lockInfo.incompleteSteps && lockInfo.incompleteSteps.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Still needed:</p>
                                    {lockInfo.incompleteSteps.slice(0, 5).map((step) => (
                                        <Link
                                            key={step}
                                            href={INCOMPLETE_STEP_HREFS[step] ?? "/onboarding"}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                                <span className="text-sm">{step}</span>
                                            </div>
                                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <Link href="/onboarding">
                                <Button className="w-full bg-brand hover:bg-brand/90 text-white gap-2">
                                    Continue Setup
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* ── ACTIVE STATE ── */}
                    {status === "active" && (
                        <div className="p-5 space-y-5">
                            {/* One-shot button */}
                            {!suggestions && !generating && !streamText && (
                                <div className="space-y-4">
                                    <div className="rounded-xl p-4 bg-brand/5 border border-brand/20">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            The AI will analyse your brand profile, platforms, case studies, and testimonials to generate tailored copy for every section of your website.
                                        </p>
                                        <Button
                                            className="w-full gap-2 bg-brand hover:bg-brand/90 text-white"
                                            onClick={() => generate("Generate website copy for all sections")}
                                            disabled={generating}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            ✨ Generate My Website
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                                        <div className="relative flex justify-center"><span className="bg-sidebar px-2 text-xs text-muted-foreground">or ask something specific</span></div>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            "Make my hero headline more punchy",
                                            "Rewrite my about section in first person",
                                            "Suggest a better section order for conversions",
                                        ].map((prompt) => (
                                            <button
                                                key={prompt}
                                                onClick={() => generate(prompt)}
                                                className="w-full text-left px-3 py-2.5 rounded-lg border border-border/60 text-sm hover:bg-accent hover:border-brand/30 transition-colors"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Streaming */}
                            {generating && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin text-brand" />
                                        Generating your website copy...
                                    </div>
                                    {streamText && (
                                        <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                                            {streamText.slice(0, 500)}{streamText.length > 500 ? "..." : ""}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Suggestions */}
                            {suggestions && !generating && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            Suggestions ready
                                        </p>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => generate()}>
                                                <RefreshCw className="h-3 w-3" />Regenerate
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-brand hover:bg-brand/90 text-white gap-1"
                                                onClick={applyAll}
                                                disabled={applying}
                                            >
                                                Apply All
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {(Object.entries(suggestions) as [keyof Suggestion, unknown][])
                                            .filter(([, v]) => v && typeof v === "string")
                                            .map(([key, value]) => (
                                                <div key={key as string} className="rounded-lg border p-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                                            {SUGGESTION_LABELS[key] ?? key}
                                                        </span>
                                                        <Button
                                                            variant={applied[key as string] ? "ghost" : "outline"}
                                                            size="sm"
                                                            className="h-6 text-xs px-2 gap-1"
                                                            onClick={() => applySuggestion(key)}
                                                            disabled={applying || !!applied[key as string]}
                                                        >
                                                            {applied[key as string]
                                                                ? <><Check className="h-3 w-3 text-green-600" />Applied</>
                                                                : "Apply"
                                                            }
                                                        </Button>
                                                    </div>
                                                    <p className="text-sm leading-relaxed">{value as string}</p>
                                                </div>
                                            ))}

                                        {suggestions.themeRecommendation && (
                                            <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
                                                <p className="text-xs font-medium text-brand mb-1">Theme Note</p>
                                                <p className="text-sm text-muted-foreground">{suggestions.themeRecommendation.note}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer input */}
                {status === "active" && (
                    <div className="p-4 border-t">
                        <div className="flex gap-2">
                            <textarea
                                ref={textareaRef}
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder='e.g. "Make my bio more conversational"'
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background resize-none h-16 focus:outline-none focus:ring-1 focus:ring-brand"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        generate();
                                    }
                                }}
                            />
                            <Button
                                className="bg-brand hover:bg-brand/90 text-white self-end"
                                size="sm"
                                onClick={() => generate()}
                                disabled={generating}
                            >
                                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Press Enter to generate · Shift+Enter for new line</p>
                    </div>
                )}
            </div>
        </div>
    );
}
