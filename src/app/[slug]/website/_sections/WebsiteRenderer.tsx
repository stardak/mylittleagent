"use client";

/**
 * WebsiteRenderer — assembles sections in order, respecting visibility.
 * Supports both public (read-only) and editor (editable) modes.
 */

import { BrandProfile, Platform, CaseStudy, Testimonial } from "@prisma/client";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { PlatformStatsSection } from "./PlatformStatsSection";
import { FeaturedWorkSection } from "./FeaturedWorkSection";
import { ServicesSection } from "./ServicesSection";
import { BrandPartnersSection } from "./BrandPartnersSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { ContactSection } from "./ContactSection";
import { FooterSection } from "./FooterSection";

interface WebsiteConfig {
    slug: string;
    heroVideoUrl: string | null;
    theme: unknown;
}

export interface SectionProps {
    profile: BrandProfile | null;
    platforms: Platform[];
    caseStudies: CaseStudy[];
    testimonials: Testimonial[];
    accentColor: string;
    headingFont: string;
    slug: string;
    heroVideoUrl?: string | null;
    /** Flat map of copy overrides: "hero.headline" → "Custom text" */
    copyOverrides?: Record<string, string>;
    /** Enables click-to-edit overlays on each text element */
    editMode?: boolean;
    /** Called when user saves an edit in the editor */
    onEdit?: (field: string, value: string) => void;
}

interface Props {
    website: WebsiteConfig;
    profile: BrandProfile | null;
    platforms: Platform[];
    caseStudies: CaseStudy[];
    testimonials: Testimonial[];
    sections: { id: string; visible: boolean }[];
    accentColor: string;
    headingFont: string;
    slug: string;
    copyOverrides?: Record<string, string>;
    editMode?: boolean;
    onEdit?: (field: string, value: string) => void;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<SectionProps>> = {
    hero: HeroSection,
    about: AboutSection,
    stats: PlatformStatsSection,
    work: FeaturedWorkSection,
    services: ServicesSection,
    partners: BrandPartnersSection,
    testimonials: TestimonialsSection,
    contact: ContactSection,
};

export function WebsiteRenderer({
    website,
    profile,
    platforms,
    caseStudies,
    testimonials,
    sections,
    accentColor,
    headingFont,
    slug,
    copyOverrides = {},
    editMode = false,
    onEdit,
}: Props) {
    const sectionProps: SectionProps = {
        profile,
        platforms,
        caseStudies,
        testimonials,
        accentColor,
        headingFont,
        slug,
        heroVideoUrl: website.heroVideoUrl,
        copyOverrides,
        editMode,
        onEdit,
    };

    return (
        <div
            style={{
                "--accent": accentColor,
                "--accent-10": accentColor + "1a",
                "--accent-20": accentColor + "33",
                "--accent-50": accentColor + "80",
                fontFamily: "system-ui, -apple-system, sans-serif",
            } as React.CSSProperties}
            className="min-h-screen bg-[#f9f8f6]"
        >
            {sections
                .filter((s) => s.visible)
                .map((s) => {
                    const Comp = SECTION_COMPONENTS[s.id];
                    if (!Comp) return null;
                    return <Comp key={s.id} {...sectionProps} />;
                })}
            <FooterSection {...sectionProps} />
        </div>
    );
}
