"use client";

/**
 * WebsiteRenderer — client component that assembles all sections
 * in the order defined by `sections` config, respecting visibility.
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

export interface SectionProps {
    profile: BrandProfile | null;
    platforms: Platform[];
    caseStudies: CaseStudy[];
    testimonials: Testimonial[];
    accentColor: string;
    headingFont: string;
    slug: string;
    heroVideoUrl?: string | null;
}

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
