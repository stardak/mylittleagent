"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Download,
    Loader2,
    Sun,
    Moon,
    Palette,
    Eye,
    EyeOff,
    RefreshCw,
    Upload,
    Link2,
    Check,
    ImageIcon,
    X,
} from "lucide-react";
import {
    MediaCardPreview,
    type MediaCardData,
    type MediaCardTheme,
    type MediaCardSections,
} from "@/components/media-card/media-card-preview";

export default function MediaCardPage() {
    const cardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<MediaCardData | null>(null);
    const [slug, setSlug] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [theme, setTheme] = useState<MediaCardTheme>("light");
    const [sections, setSections] = useState<MediaCardSections>({
        platforms: true,
        audience: true,
        categories: true,
        brandPartners: true,
        testimonials: true,
        portfolio: true,
        contact: true,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/media-card");
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();
            setData(json);
            setSlug(json.slug || "");
        } catch {
            toast.error("Failed to load media card data. Complete your profile in Settings first.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleSection = (key: keyof MediaCardSections) => {
        setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const downloadPng = async () => {
        if (!cardRef.current) return;
        setExporting(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                backgroundColor: "transparent",
            });
            const link = document.createElement("a");
            link.download = `${data?.brand.name?.replace(/\s+/g, "-") ?? "media-card"}-media-card.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Media card downloaded!");
        } catch (err) {
            console.error("Export error:", err);
            toast.error("Failed to export media card");
        } finally {
            setExporting(false);
        }
    };

    const uploadHeroImage = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("field", "heroImageUrl");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload failed");
            }

            const { url } = await res.json();
            // Update data locally
            setData((prev) =>
                prev ? { ...prev, brand: { ...prev.brand, heroImageUrl: url } } : prev
            );
            toast.success("Hero image uploaded!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const removeHeroImage = async () => {
        try {
            // Clear the hero image by uploading a null value
            const res = await fetch("/api/media-card/hero", {
                method: "DELETE",
            });
            if (res.ok) {
                setData((prev) =>
                    prev ? { ...prev, brand: { ...prev.brand, heroImageUrl: null } } : prev
                );
                toast.success("Hero image removed");
            }
        } catch {
            toast.error("Failed to remove image");
        }
    };

    const copyPublicLink = () => {
        const url = `${window.location.origin}/${slug}/mediacard`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            toast.success("Public link copied!");
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const themes: { key: MediaCardTheme; label: string; icon: typeof Sun }[] = [
        { key: "light", label: "Light", icon: Sun },
        { key: "dark", label: "Dark", icon: Moon },
        { key: "brand", label: "Brand", icon: Palette },
    ];

    const sectionToggles: { key: keyof MediaCardSections; label: string }[] = [
        { key: "platforms", label: "Platforms" },
        { key: "audience", label: "Audience" },
        { key: "categories", label: "Categories" },
        { key: "brandPartners", label: "Brand Partners" },
        { key: "testimonials", label: "Testimonials" },
        { key: "portfolio", label: "Previous Work" },
        { key: "contact", label: "Contact Info" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-semibold">Media Card</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate a beautiful, shareable card with your creator stats.
                    </p>
                </div>
                {slug && (
                    <Button
                        variant="outline"
                        onClick={copyPublicLink}
                        className="gap-2"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                        {copied ? "Copied!" : "Copy Public Link"}
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : !data ? (
                <Card className="max-w-md mx-auto">
                    <CardContent className="text-center py-16">
                        <div className="text-5xl mb-4">📋</div>
                        <h3 className="text-lg font-heading font-semibold mb-2">
                            Profile Not Found
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Complete your brand profile in Settings or Onboarding to generate a media card.
                        </p>
                        <Button variant="outline" onClick={() => (window.location.href = "/settings")}>
                            Go to Settings
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
                    {/* ── Card Preview ─────────────────── */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div
                                className="absolute -inset-6 rounded-[36px] opacity-15 blur-3xl pointer-events-none"
                                style={{
                                    background:
                                        theme === "dark"
                                            ? "radial-gradient(circle, #818cf8 0%, transparent 70%)"
                                            : theme === "brand"
                                                ? `radial-gradient(circle, ${data.brand.primaryColor} 0%, transparent 70%)`
                                                : "radial-gradient(circle, #6366f1 0%, transparent 70%)",
                                }}
                            />
                            <MediaCardPreview
                                ref={cardRef}
                                data={data}
                                theme={theme}
                                sections={sections}
                            />
                        </div>
                    </div>

                    {/* ── Controls Panel ────────────────── */}
                    <div className="space-y-4">
                        {/* Hero Image Upload */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-brand" />
                                    Hero Image
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadHeroImage(file);
                                    }}
                                />
                                {data.brand.heroImageUrl ? (
                                    <div className="space-y-2">
                                        <div className="relative rounded-xl overflow-hidden aspect-[16/9]">
                                            <img
                                                src={data.brand.heroImageUrl}
                                                alt="Hero"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={removeHeroImage}
                                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="w-full gap-2"
                                        >
                                            {uploading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Upload className="h-3.5 w-3.5" />
                                            )}
                                            Replace Image
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-brand/40 hover:text-brand transition-colors cursor-pointer"
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <Upload className="h-6 w-6" />
                                        )}
                                        <span className="text-xs font-medium">
                                            {uploading ? "Uploading…" : "Upload Hero Image"}
                                        </span>
                                        <span className="text-xs opacity-60">
                                            JPEG, PNG, WebP · Max 5MB
                                        </span>
                                    </button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Theme Selector */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-brand" />
                                    Theme
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-2">
                                    {themes.map((t) => (
                                        <button
                                            key={t.key}
                                            onClick={() => setTheme(t.key)}
                                            className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-xs font-medium transition-all cursor-pointer ${theme === t.key
                                                ? "bg-brand/10 text-brand ring-2 ring-brand/30"
                                                : "bg-accent text-muted-foreground hover:bg-accent/80"
                                                }`}
                                        >
                                            <t.icon className="h-4 w-4" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section Toggles */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    {Object.values(sections).some(Boolean) ? (
                                        <Eye className="h-4 w-4 text-brand" />
                                    ) : (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    Sections
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sectionToggles.map((s) => (
                                    <div key={s.key} className="flex items-center justify-between">
                                        <Label htmlFor={s.key} className="text-sm cursor-pointer">
                                            {s.label}
                                        </Label>
                                        <Switch
                                            id={s.key}
                                            checked={sections[s.key]}
                                            onCheckedChange={() => toggleSection(s.key)}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Separator />

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button
                                onClick={downloadPng}
                                disabled={exporting}
                                className="w-full gap-2"
                                size="lg"
                            >
                                {exporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {exporting ? "Exporting…" : "Download PNG"}
                            </Button>
                            {slug && (
                                <Button
                                    variant="outline"
                                    onClick={copyPublicLink}
                                    className="w-full gap-2"
                                    size="sm"
                                >
                                    {copied ? (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <Link2 className="h-3.5 w-3.5" />
                                    )}
                                    {copied ? "Copied!" : "Copy Public Link"}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                onClick={fetchData}
                                disabled={loading}
                                className="w-full gap-2 text-muted-foreground"
                                size="sm"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh Data
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
