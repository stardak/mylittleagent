"use client";

/**
 * /website — Dashboard Website Editor Page
 * Left: controls. Right: live editable section renderer (replaces iframe).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
    Globe,
    Eye,
    Pencil,
    Copy,
    Check,
    Sparkles,
    Loader2,
    ExternalLink,
    Lock,
    Unlock,
    RefreshCw,
    Camera,
    ImagePlus,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AiWebsitePanel } from "@/components/website/AiWebsitePanel";
import { WebsiteRenderer } from "@/app/[slug]/website/_sections/WebsiteRenderer";
import { BrandProfile, Platform, CaseStudy, Testimonial } from "@prisma/client";

interface SectionConfig {
    id: string;
    visible: boolean;
    copy?: Record<string, string>;
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
    const [profile, setProfile] = useState<BrandProfile | null>(null);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [slugInput, setSlugInput] = useState("");
    const [slugStatus, setSlugStatus] = useState<"idle" | "available" | "taken" | "checking">("idle");
    const [copied, setCopied] = useState(false);
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [iframeKey, setIframeKey] = useState(0);
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [uploadingHero, setUploadingHero] = useState(false);
    const heroFileRef = useRef<HTMLInputElement>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchWebsite = useCallback(async () => {
        try {
            const res = await fetch("/api/website");
            if (res.ok) {
                const data = await res.json();
                setWebsite(data.website);
                setProfile(data.profile ?? null);
                setPlatforms(data.platforms ?? []);
                setCaseStudies(data.caseStudies ?? []);
                setTestimonials(data.testimonials ?? []);
                setSlugInput(data.website.slug);
                setSeoTitle(data.website.seoTitle ?? "");
                setSeoDescription(data.website.seoDescription ?? "");
            }
        } catch { toast.error("Failed to load website config"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchWebsite(); }, [fetchWebsite]);

    const save = useCallback(async (patch: Partial<WebsiteConfig>) => {
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
            } else {
                const err = await res.json();
                toast.error(err.error ?? "Failed to save");
            }
        } catch { toast.error("Failed to save"); }
        finally { setSaving(false); }
    }, [website]);

    // Handle inline field edits — update section copy and debounced save
    const handleFieldEdit = useCallback((field: string, value: string) => {
        if (!website) return;
        const [sectionId, ...rest] = field.split(".");
        const fieldKey = rest.join(".");

        const updatedSections = website.sections.map((s) => {
            if (s.id === sectionId) {
                return { ...s, copy: { ...(s.copy ?? {}), [fieldKey]: value } };
            }
            return s;
        });

        // Optimistically update local state immediately
        setWebsite((prev) => prev ? { ...prev, sections: updatedSections } : prev);

        // Debounced save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            save({ sections: updatedSections });
            toast.success("Saved", { id: "field-save", duration: 1500 });
        }, 800);
    }, [website, save]);

    // Build flat copyOverrides from all sections
    const copyOverrides = website?.sections.reduce((acc, s) => {
        Object.entries(s.copy ?? {}).forEach(([k, v]) => {
            acc[`${s.id}.${k}`] = v;
        });
        return acc;
    }, {} as Record<string, string>) ?? {};

    const toggleSection = (id: string) => {
        if (!website) return;
        const updated = website.sections.map((s) =>
            s.id === id ? { ...s, visible: !s.visible } : s
        );
        save({ sections: updated });
        setWebsite((prev) => prev ? { ...prev, sections: updated } : prev);
    };

    const togglePublish = () => {
        if (!website) return;
        const newVal = !website.isPublished;
        setWebsite((prev) => prev ? { ...prev, isPublished: newVal } : prev);
        save({ isPublished: newVal });
        toast.success(newVal ? "Website published! 🎉" : "Website unpublished");
    };

    const checkSlug = useCallback(async (slug: string) => {
        if (slug.length < 2) { setSlugStatus("idle"); return; }
        setSlugStatus("checking");
        try {
            const res = await fetch(`/api/website/check-slug?slug=${encodeURIComponent(slug)}`);
            const data = await res.json();
            setSlugStatus(data.available ? "available" : "taken");
        } catch { setSlugStatus("idle"); }
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
        navigator.clipboard.writeText(`${window.location.origin}/${website.slug}/website`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const publicUrl = website ? `${typeof window !== "undefined" ? window.location.origin : ""}/${website.slug}/website` : "";

    const theme = (website?.theme as { accentColor?: string; headingFont?: string } | null) ?? {};
    const accentColor = theme.accentColor ?? "#1A9E96";
    const headingFont = theme.headingFont ?? "inherit";

    const handleAiSuggestions = async (suggestions: Record<string, string>) => {
        if (!website) return;
        const patch: Partial<WebsiteConfig> = {};
        if (suggestions.seoTitle) { patch.seoTitle = suggestions.seoTitle; setSeoTitle(suggestions.seoTitle); }
        if (suggestions.seoDescription) { patch.seoDescription = suggestions.seoDescription; setSeoDescription(suggestions.seoDescription); }

        // Update section copy override fields from AI suggestions
        const fieldMapping: Record<string, string> = {
            heroHeadline: "hero.headline",
            heroTagline: "hero.tagline",
            heroSubtext: "hero.bio",
            aboutText: "about.bio",
            servicesHeadline: "services.heading",
            statsHeadline: "stats.heading",
            workHeadline: "work.heading",
            testimonialsHeadline: "testimonials.heading",
        };

        let updatedSections = website.sections;
        Object.entries(fieldMapping).forEach(([aiKey, fieldPath]) => {
            if (suggestions[aiKey]) {
                const [sectionId, ...rest] = fieldPath.split(".");
                const fKey = rest.join(".");
                updatedSections = updatedSections.map((s) =>
                    s.id === sectionId ? { ...s, copy: { ...(s.copy ?? {}), [fKey]: suggestions[aiKey] } } : s
                );
            }
        });
        patch.sections = updatedSections;

        if (Object.keys(patch).length > 0) {
            await save(patch);
            setWebsite((prev) => prev ? { ...prev, ...patch } : prev);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!website) return <div className="p-8"><p className="text-muted-foreground">Failed to load website configuration.</p></div>;

    return (
        <div className="flex h-[calc(100vh-0px)] overflow-hidden">
            {/* ── Left Controls Panel ── */}
            <div className="w-72 flex-shrink-0 border-r bg-sidebar overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Globe className="h-4 w-4 text-brand" />
                        <h1 className="font-heading text-base font-semibold">My Website</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">Build and publish your creator site</p>
                </div>

                {/* Publish */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {website.isPublished
                                ? <Unlock className="h-3.5 w-3.5 text-green-600" />
                                : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                            <span className="text-sm font-medium">{website.isPublished ? "Published" : "Unpublished"}</span>
                        </div>
                        <Switch checked={website.isPublished} onCheckedChange={togglePublish} disabled={saving} />
                    </div>
                    {website.isPublished && (
                        <div className="flex items-center gap-1.5">
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                                className="flex-1 text-xs text-brand truncate hover:underline">{publicUrl.replace(/^https?:\/\//, "")}</a>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyLink}>
                                {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                            </Button>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><ExternalLink className="h-3 w-3" /></Button>
                            </a>
                        </div>
                    )}
                </div>

                {/* AI */}
                <div className="p-4 border-b">
                    <Button className="w-full gap-2 bg-brand hover:bg-brand/90 text-white h-8 text-sm" onClick={() => setAiPanelOpen(true)}>
                        <Sparkles className="h-3.5 w-3.5" />AI Website Builder
                    </Button>
                </div>

                {/* Hero Image */}
                <div className="p-4 border-b space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Hero Image</Label>
                    <input
                        ref={heroFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingHero(true);
                            try {
                                const fd = new FormData();
                                fd.append("file", file);
                                const res = await fetch("/api/upload", { method: "POST", body: fd });
                                if (res.ok) {
                                    const { url } = await res.json();
                                    handleFieldEdit("hero.imageUrl", url);
                                    toast.success("Hero image updated!");
                                }
                            } catch { toast.error("Upload failed"); }
                            finally { setUploadingHero(false); if (heroFileRef.current) heroFileRef.current.value = ""; }
                        }}
                    />
                    {/* Preview thumbnail */}
                    {copyOverrides["hero.imageUrl"] || profile?.heroImageUrl ? (
                        <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={copyOverrides["hero.imageUrl"] ?? profile?.heroImageUrl ?? ""}
                                alt="Hero"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                                <button
                                    onClick={() => heroFileRef.current?.click()}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 text-xs font-medium"
                                >
                                    <Camera className="h-3 w-3" />Change
                                </button>
                                {copyOverrides["hero.imageUrl"] && (
                                    <button
                                        onClick={() => handleFieldEdit("hero.imageUrl", "")}
                                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 text-xs font-medium text-red-600"
                                    >
                                        <Trash2 className="h-3 w-3" />Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : null}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs gap-1.5"
                        onClick={() => heroFileRef.current?.click()}
                        disabled={uploadingHero}
                    >
                        {uploadingHero
                            ? <><Loader2 className="h-3 w-3 animate-spin" />Uploading...</>
                            : <><ImagePlus className="h-3 w-3" />{copyOverrides["hero.imageUrl"] ? "Replace Image" : "Upload Hero Image"}</>
                        }
                    </Button>
                    {copyOverrides["hero.imageUrl"] && (
                        <p className="text-[10px] text-muted-foreground text-center">
                            Using website-specific image · <button className="underline" onClick={() => handleFieldEdit("hero.imageUrl", "")}>Reset to profile image</button>
                        </p>
                    )}
                </div>

                {/* URL Slug */}
                <div className="p-4 border-b space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Site URL</Label>
                    <div className="flex gap-2">
                        <Input value={slugInput} onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                            placeholder="your-name" className="h-7 text-xs" />
                        <Button variant="outline" size="sm" onClick={applySlug} disabled={slugStatus !== "available" || saving} className="h-7 shrink-0 text-xs px-2">Apply</Button>
                    </div>
                    {slugStatus === "checking" && <p className="text-xs text-muted-foreground">Checking...</p>}
                    {slugStatus === "available" && <p className="text-xs text-green-600">✓ Available</p>}
                    {slugStatus === "taken" && <p className="text-xs text-red-500">✗ Already taken</p>}
                </div>

                {/* Sections */}
                <div className="p-4 border-b flex-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2.5 block">Sections</Label>
                    <div className="space-y-1.5">
                        {website.sections.map((section) => (
                            <div key={section.id} className="flex items-center justify-between rounded-lg px-2.5 py-2 bg-background border border-border/40">
                                <span className="text-xs">{SECTION_LABELS[section.id] ?? section.id}</span>
                                <Switch checked={section.visible} onCheckedChange={() => toggleSection(section.id)} disabled={saving} className="scale-[0.65]" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* SEO */}
                <div className="p-4 space-y-3">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">SEO</Label>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Page Title</Label>
                        <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Creator Name | Content Creator" className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Meta Description</Label>
                        <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)}
                            placeholder="Award-winning storyteller..."
                            className="w-full px-2.5 py-2 text-xs rounded-md border border-input bg-background resize-none h-14 focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => save({ seoTitle, seoDescription })} disabled={saving}>
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}Save SEO
                    </Button>
                </div>
            </div>

            {/* ── Right Renderer / Preview Pane ── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f0ee]">
                {/* Browser chrome bar */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b shrink-0">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-2.5 py-1 bg-[#f5f5f5] rounded-md border text-xs text-muted-foreground truncate">
                        <Globe className="h-3 w-3 shrink-0" />{publicUrl || `/${website.slug}/website`}
                    </div>
                    {/* Edit / Preview toggle */}
                    <div className="flex items-center rounded-lg border overflow-hidden">
                        <button
                            onClick={() => setViewMode("edit")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "edit" ? "bg-brand text-white" : "hover:bg-muted"}`}
                        >
                            <Pencil className="h-3 w-3" />Edit
                        </button>
                        <button
                            onClick={() => { setViewMode("preview"); setIframeKey((k) => k + 1); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "preview" ? "bg-brand text-white" : "hover:bg-muted"}`}
                        >
                            <Eye className="h-3 w-3" />Preview
                        </button>
                    </div>
                    {viewMode === "preview" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIframeKey((k) => k + 1)}>
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-hidden">
                    {viewMode === "edit" ? (
                        /* Live editable renderer */
                        <div className="h-full overflow-y-auto">
                            <div className="relative">
                                {saving && (
                                    <div className="sticky top-2 z-50 flex justify-center pointer-events-none">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs backdrop-blur-sm">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Saving...
                                        </div>
                                    </div>
                                )}
                                <WebsiteRenderer
                                    website={{
                                        slug: website.slug,
                                        heroVideoUrl: website.heroVideoUrl,
                                        theme: website.theme,
                                    }}
                                    profile={profile}
                                    platforms={platforms}
                                    caseStudies={caseStudies}
                                    testimonials={testimonials}
                                    sections={website.sections}
                                    accentColor={accentColor}
                                    headingFont={headingFont}
                                    slug={website.slug}
                                    copyOverrides={copyOverrides}
                                    editMode={true}
                                    onEdit={handleFieldEdit}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Real URL iframe preview */
                        <iframe
                            key={iframeKey}
                            src={`/${website.slug}/website?preview=1`}
                            className="w-full h-full border-0"
                            title="Website Preview"
                        />
                    )}
                </div>
            </div>

            {/* AI Panel */}
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
