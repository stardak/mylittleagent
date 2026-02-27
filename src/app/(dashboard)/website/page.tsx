"use client";

/**
 * /website — Dashboard Website Editor Page
 * Two-pane layout: editor on left, live preview iframe on right.
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    Globe,
    Eye,
    EyeOff,
    Copy,
    Check,
    Sparkles,
    Loader2,
    RefreshCw,
    ExternalLink,
    Lock,
    Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AiWebsitePanel } from "@/components/website/AiWebsitePanel";

interface SectionConfig {
    id: string;
    visible: boolean;
}

interface WebsiteConfig {
    id: string;
    isPublished: boolean;
    slug: string;
    heroVideoUrl: string | null;
    sections: SectionConfig[];
    theme: unknown;
    seoTitle: string | null;
    seoDescription: string | null;
}

const SECTION_LABELS: Record<string, string> = {
    hero: "🎬 Hero",
    about: "👤 About",
    stats: "📊 Platform Stats",
    work: "✨ Featured Work",
    services: "🛠 Services",
    partners: "🤝 Brand Partners",
    testimonials: "💬 Testimonials",
    contact: "📩 Contact",
};

export default function WebsitePage() {
    const [website, setWebsite] = useState<WebsiteConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [slugInput, setSlugInput] = useState("");
    const [slugStatus, setSlugStatus] = useState<"idle" | "available" | "taken" | "checking">("idle");
    const [copied, setCopied] = useState(false);
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");

    const fetchWebsite = useCallback(async () => {
        try {
            const res = await fetch("/api/website");
            if (res.ok) {
                const { website: w } = await res.json();
                setWebsite(w);
                setSlugInput(w.slug);
                setSeoTitle(w.seoTitle ?? "");
                setSeoDescription(w.seoDescription ?? "");
            }
        } catch {
            toast.error("Failed to load website config");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchWebsite(); }, [fetchWebsite]);

    const save = async (patch: Partial<WebsiteConfig>) => {
        if (!website) return;
        setSaving(true);
        try {
            const res = await fetch("/api/website", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (res.ok) {
                const { website: w } = await res.json();
                setWebsite(w);
                setIframeKey((k) => k + 1);
                toast.success("Saved!");
            } else {
                const err = await res.json();
                toast.error(err.error ?? "Failed to save");
            }
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const toggleSection = (id: string) => {
        if (!website) return;
        const updated = website.sections.map((s) =>
            s.id === id ? { ...s, visible: !s.visible } : s
        );
        save({ sections: updated });
    };

    const togglePublish = () => {
        if (!website) return;
        save({ isPublished: !website.isPublished });
        toast.success(website.isPublished ? "Website unpublished" : "Website published! 🎉");
    };

    const checkSlug = useCallback(async (slug: string) => {
        if (slug.length < 2) { setSlugStatus("idle"); return; }
        setSlugStatus("checking");
        try {
            const res = await fetch(`/api/website/check-slug?slug=${encodeURIComponent(slug)}`);
            const data = await res.json();
            setSlugStatus(data.available ? "available" : "taken");
        } catch {
            setSlugStatus("idle");
        }
    }, []);

    useEffect(() => {
        if (slugInput === website?.slug) { setSlugStatus("idle"); return; }
        const t = setTimeout(() => checkSlug(slugInput), 500);
        return () => clearTimeout(t);
    }, [slugInput, website?.slug, checkSlug]);

    const applySlug = () => {
        if (slugStatus !== "available") return;
        save({ slug: slugInput });
    };

    const copyLink = () => {
        if (!website) return;
        const url = `${window.location.origin}/${website.slug}/website`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const publicUrl = website ? `${typeof window !== "undefined" ? window.location.origin : ""}/${website.slug}/website` : "";

    // Apply AI suggestions to the config
    const handleAiSuggestions = async (suggestions: Record<string, string>) => {
        if (!website) return;
        const patch: Partial<WebsiteConfig> = {};
        if (suggestions.seoTitle) patch.seoTitle = suggestions.seoTitle;
        if (suggestions.seoDescription) patch.seoDescription = suggestions.seoDescription;
        if (suggestions.sectionOrder) {
            const order = suggestions.sectionOrder as unknown as string[];
            const reordered = order
                .map((id) => website.sections.find((s) => s.id === id))
                .filter(Boolean) as SectionConfig[];
            // Include any sections not in the AI order
            const remaining = website.sections.filter((s) => !order.includes(s.id));
            patch.sections = [...reordered, ...remaining];
        }
        if (Object.keys(patch).length > 0) {
            await save(patch);
            if (suggestions.seoTitle) setSeoTitle(suggestions.seoTitle);
            if (suggestions.seoDescription) setSeoDescription(suggestions.seoDescription);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!website) {
        return (
            <div className="p-8">
                <p className="text-muted-foreground">Failed to load website configuration.</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-0px)] overflow-hidden">
            {/* ── Left Editor Panel ── */}
            <div className="w-80 flex-shrink-0 border-r bg-sidebar overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-5 border-b">
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-5 w-5 text-brand" />
                        <h1 className="font-heading text-lg font-semibold">My Website</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">Build and publish your creator site</p>
                </div>

                {/* Publish toggle */}
                <div className="p-5 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {website.isPublished
                                ? <Unlock className="h-4 w-4 text-green-600" />
                                : <Lock className="h-4 w-4 text-muted-foreground" />
                            }
                            <span className="text-sm font-medium">
                                {website.isPublished ? "Published" : "Unpublished"}
                            </span>
                        </div>
                        <Switch
                            checked={website.isPublished}
                            onCheckedChange={togglePublish}
                            disabled={saving}
                        />
                    </div>

                    {website.isPublished && (
                        <div className="flex items-center gap-2">
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-xs text-brand truncate hover:underline"
                            >
                                {publicUrl.replace("https://", "")}
                            </a>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyLink}>
                                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                            </a>
                        </div>
                    )}
                </div>

                {/* AI Button */}
                <div className="p-5 border-b">
                    <Button
                        className="w-full gap-2 bg-brand hover:bg-brand/90 text-white"
                        onClick={() => setAiPanelOpen(true)}
                    >
                        <Sparkles className="h-4 w-4" />
                        AI Website Builder
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Let AI generate your site copy from your profile
                    </p>
                </div>

                {/* URL Slug */}
                <div className="p-5 border-b space-y-3">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Site URL</Label>
                    <div className="flex gap-2">
                        <Input
                            value={slugInput}
                            onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                            placeholder="your-name"
                            className="h-8 text-sm"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={applySlug}
                            disabled={slugStatus !== "available" || saving}
                            className="h-8 shrink-0"
                        >
                            Apply
                        </Button>
                    </div>
                    {slugStatus === "checking" && <p className="text-xs text-muted-foreground">Checking...</p>}
                    {slugStatus === "available" && <p className="text-xs text-green-600">✓ Available</p>}
                    {slugStatus === "taken" && <p className="text-xs text-red-500">✗ Already taken</p>}
                </div>

                {/* Sections */}
                <div className="p-5 border-b flex-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 block">Sections</Label>
                    <div className="space-y-2">
                        {website.sections.map((section) => (
                            <div
                                key={section.id}
                                className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-background border border-border/40"
                            >
                                <span className="text-sm">{SECTION_LABELS[section.id] ?? section.id}</span>
                                <div className="flex items-center gap-2">
                                    {section.visible
                                        ? <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                        : <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                                    }
                                    <Switch
                                        checked={section.visible}
                                        onCheckedChange={() => toggleSection(section.id)}
                                        disabled={saving}
                                        className="scale-75"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SEO */}
                <div className="p-5 space-y-4">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">SEO</Label>
                    <div className="space-y-2">
                        <Label className="text-xs">Page Title</Label>
                        <Input
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            placeholder="Creator Name | Content Creator"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Meta Description</Label>
                        <textarea
                            value={seoDescription}
                            onChange={(e) => setSeoDescription(e.target.value)}
                            placeholder="Award-winning storyteller and content creator..."
                            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => save({ seoTitle, seoDescription })}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Save SEO
                    </Button>
                </div>
            </div>

            {/* ── Right Preview Pane ── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f0ee]">
                <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f5] rounded-md border text-xs text-muted-foreground truncate">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        {publicUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/${website.slug}/website`}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIframeKey((k) => k + 1)}
                        title="Refresh preview"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <iframe
                        key={iframeKey}
                        src={`/${website.slug}/website`}
                        className="w-full h-full border-0"
                        title="Website Preview"
                    />
                </div>
            </div>

            {/* ── AI Panel Slide-over ── */}
            {aiPanelOpen && (
                <AiWebsitePanel
                    onClose={() => setAiPanelOpen(false)}
                    onApplySuggestions={handleAiSuggestions}
                    websiteSlug={website.slug}
                />
            )}
        </div>
    );
}
