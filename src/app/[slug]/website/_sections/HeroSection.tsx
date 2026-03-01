"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

export function HeroSection({ profile, platforms, accentColor, headingFont, heroVideoUrl, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const combinedFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
    const totalViews = platforms.reduce((sum, p) => sum + (p.totalViews ?? 0), 0);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => { });
        }
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const { url } = await res.json();
                onEdit?.("hero.imageUrl", url);
            }
        } catch {
            console.error("Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const formatNum = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M+`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
        return String(n);
    };

    const stats = [
        combinedFollowers > 0 && { label: "Combined Reach", value: formatNum(combinedFollowers) },
        totalViews > 0 && { label: "Total Views", value: formatNum(totalViews) },
        platforms.length > 0 && { label: "Platforms", value: String(platforms.length) },
    ].filter(Boolean) as { label: string; value: string }[];

    const headline = copyOverrides["hero.headline"] ?? profile?.brandName?.toUpperCase() ?? "CREATOR";
    const tagline = copyOverrides["hero.tagline"] ?? profile?.tagline ?? "";
    const bio = copyOverrides["hero.bio"] ?? profile?.bio?.split("\n")[0] ?? "";
    const location = copyOverrides["hero.location"] ?? profile?.location ?? "";
    const heroImageUrl = copyOverrides["hero.imageUrl"] ?? profile?.heroImageUrl ?? "";

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0e0e0e]">
            {/* Background */}
            <div className="absolute inset-0 group/bg">
                {heroVideoUrl ? (
                    <video ref={videoRef} autoPlay loop muted playsInline poster={heroImageUrl || undefined}
                        className="absolute inset-0 w-full h-full object-cover">
                        <source src={heroVideoUrl} type="video/mp4" />
                    </video>
                ) : heroImageUrl ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImageUrl})` }} />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />

                {editMode && (
                    <>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl
                                bg-black/60 backdrop-blur-sm border border-white/20 text-white text-sm
                                hover:bg-black/80 transition-all duration-200 opacity-0 group-hover/bg:opacity-100"
                        >
                            {uploading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                : <><Camera className="w-4 h-4" /> Change Hero Image</>
                            }
                        </button>
                    </>
                )}
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10 w-full py-32 md:py-40 text-center">
                {location && (
                    <EditableField field="hero.location" value={location} editMode={editMode} onEdit={onEdit} accentColor={accentColor}>
                        <p className="text-sm tracking-[0.25em] uppercase font-medium mb-6" style={{ color: accentColor }}>
                            {location}
                        </p>
                    </EditableField>
                )}

                <EditableField field="hero.headline" value={headline} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block mb-6">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[0.95]"
                        style={{ fontFamily: headingFont }}>
                        {headline}
                    </h1>
                </EditableField>

                {(tagline || editMode) && (
                    <EditableField field="hero.tagline" value={tagline} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block mb-6">
                        <p className="text-xl md:text-2xl text-white/80 font-light" style={{ fontFamily: headingFont }}>
                            {tagline || <span className="opacity-40 italic">Add a tagline...</span>}
                        </p>
                    </EditableField>
                )}

                {(bio || editMode) && (
                    <EditableField field="hero.bio" value={bio} editMode={editMode} onEdit={onEdit} multiline accentColor={accentColor} wrapClassName="block mb-10">
                        <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
                            {bio || <span className="opacity-40 italic">Add a short intro...</span>}
                        </p>
                    </EditableField>
                )}

                {!editMode && (
                    <div className="flex flex-wrap gap-4 mb-16 justify-center">
                        <a href="#contact"
                            className="inline-flex items-center gap-2 px-8 py-3.5 text-white text-sm tracking-widest uppercase rounded-full transition-all duration-300 hover:opacity-90"
                            style={{ backgroundColor: accentColor }}>
                            Work With Me
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </a>
                        <a href="#about"
                            className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/30 text-white text-sm tracking-widest uppercase rounded-full hover:border-white/60 transition-colors duration-300">
                            Learn More
                        </a>
                    </div>
                )}


            </div>

            {!editMode && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
                    </div>
                </div>
            )}
        </section>
    );
}
