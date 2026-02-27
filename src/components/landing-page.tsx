"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
    Sparkles,
    ArrowRight,
    ChevronDown,
    Mail,
    DollarSign,
    MessageSquare,
    FileText,
    Clock,
    UserX,
    LayoutDashboard,
    Send,
    Brain,
    Users,
    Handshake,
    CalendarCheck,
    Receipt,
    Star,
    Check,
    X,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    Award,
    Tv,
    Zap,
} from "lucide-react";

/* ───────────────────────────── Scroll Animation Hook ───────────────────────────── */

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add("landing-visible");
                    observer.unobserve(el);
                }
            },
            { threshold: 0.12 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

function RevealSection({
    children,
    className = "",
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useScrollReveal();
    return (
        <div
            ref={ref}
            className={`landing-reveal ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/* ───────────────────────────── Navigation ───────────────────────────── */

function Nav() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="h-10 w-10 flex items-center justify-center shrink-0">
                        <video src="/robot.webm" autoPlay loop muted playsInline className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-heading font-bold text-white tracking-wide">
                        My Little Agent
                    </span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
                    <a href="#features" className="hover:text-white transition-colors">
                        Features
                    </a>
                    <a href="#founder" className="hover:text-white transition-colors">
                        About
                    </a>
                    <a href="#pricing" className="hover:text-white transition-colors">
                        Pricing
                    </a>
                </div>
                <Link
                    href="/register"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3382] to-[#c026d3] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[#ea3382]/25 hover:shadow-[#ea3382]/40"
                >
                    Get Started
                </Link>
            </div>
        </nav>
    );
}

/* ───────────────────────────── Hero ───────────────────────────── */

function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[#0a0a0c]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(234,51,130,0.15),_transparent_60%)]" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(192,38,211,0.08),_transparent_70%)]" />

            {/* Floating orbs */}
            <div className="absolute top-32 left-[15%] w-2 h-2 bg-[#ea3382] rounded-full landing-float opacity-40" />
            <div
                className="absolute top-48 right-[20%] w-1.5 h-1.5 bg-[#c026d3] rounded-full landing-float opacity-30"
                style={{ animationDelay: "1s" }}
            />
            <div
                className="absolute bottom-40 left-[25%] w-1 h-1 bg-[#ea3382] rounded-full landing-float opacity-25"
                style={{ animationDelay: "2s" }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <RevealSection>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 mb-8 backdrop-blur-sm">
                        <Zap className="h-3.5 w-3.5 text-[#ea3382]" />
                        Built by a creator, for creators
                    </div>
                </RevealSection>

                <RevealSection delay={100}>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-semibold text-white leading-[1.1] tracking-tight mb-6">
                        Stop waiting for brands{" "}
                        <br className="hidden sm:block" />
                        to find you.{" "}
                        <span className="bg-gradient-to-r from-[#ea3382] to-[#c026d3] bg-clip-text text-transparent">
                            Run your creator business
                        </span>{" "}
                        like a pro.
                    </h1>
                </RevealSection>

                <RevealSection delay={200}>
                    <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Own your pipeline. Pitch with confidence. Get paid what you&apos;re
                        worth. The all-in-one platform that replaces the need for a talent
                        manager.
                    </p>
                </RevealSection>

                <RevealSection delay={300}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#ea3382] to-[#c026d3] text-white font-semibold text-lg hover:opacity-90 transition-all shadow-2xl shadow-[#ea3382]/30 hover:shadow-[#ea3382]/50 hover:scale-[1.02]"
                        >
                            Start Pitching Today
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#pain-points"
                            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                        >
                            See how it works
                            <ChevronDown className="h-4 w-4" />
                        </a>
                    </div>
                </RevealSection>

                {/* Abstract dashboard mockup */}
                <RevealSection delay={500}>
                    <div className="mt-16 md:mt-20 relative mx-auto max-w-3xl">
                        <div className="absolute -inset-4 bg-gradient-to-b from-[#ea3382]/20 to-transparent rounded-2xl blur-2xl" />
                        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 md:p-8 overflow-hidden">
                            {/* Mock dashboard header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                </div>
                                <div className="flex-1 h-5 rounded-md bg-white/5" />
                            </div>
                            {/* Mock content */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="h-20 rounded-xl bg-gradient-to-br from-[#ea3382]/10 to-[#c026d3]/5 border border-white/5 p-3">
                                    <div className="w-8 h-2 rounded bg-[#ea3382]/30 mb-2" />
                                    <div className="w-12 h-5 rounded bg-white/10" />
                                </div>
                                <div className="h-20 rounded-xl bg-white/[0.03] border border-white/5 p-3">
                                    <div className="w-10 h-2 rounded bg-white/10 mb-2" />
                                    <div className="w-14 h-5 rounded bg-white/10" />
                                </div>
                                <div className="h-20 rounded-xl bg-white/[0.03] border border-white/5 p-3">
                                    <div className="w-6 h-2 rounded bg-white/10 mb-2" />
                                    <div className="w-10 h-5 rounded bg-white/10" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ea3382]/20 to-[#c026d3]/10" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="w-24 h-2.5 rounded bg-white/10" />
                                            <div className="w-40 h-2 rounded bg-white/5" />
                                        </div>
                                        <div className="w-16 h-6 rounded-full bg-[#ea3382]/10 border border-[#ea3382]/20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </RevealSection>
            </div>
        </section>
    );
}

/* ───────────────────────────── Pain Points ───────────────────────────── */

const painPoints = [
    {
        icon: Mail,
        text: "Spending hours writing outreach emails that get completely ignored",
    },
    {
        icon: DollarSign,
        text: "Having no idea what to charge — and underpricing yourself every time",
    },
    {
        icon: MessageSquare,
        text: "Losing track of brand conversations scattered across email, DMs, and WhatsApp",
    },
    {
        icon: FileText,
        text: "Recreating your media kit from scratch for every single opportunity",
    },
    {
        icon: Clock,
        text: "Deals falling through because you forgot to follow up",
    },
    {
        icon: UserX,
        text: "Feeling unprofessional compared to creators who have management",
    },
];

function PainPoints() {
    return (
        <section
            id="pain-points"
            className="relative py-24 md:py-32 bg-[#0a0a0c]"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(234,51,130,0.06),_transparent_60%)]" />
            <div className="relative z-10 max-w-6xl mx-auto px-6">
                <RevealSection>
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium text-[#ea3382] tracking-wide uppercase mb-3">
                            Sound familiar?
                        </p>
                        <h2 className="text-3xl md:text-5xl font-heading font-semibold text-white mb-4">
                            You&apos;re doing it all yourself.
                            <br />
                            <span className="text-zinc-500">And it&apos;s exhausting.</span>
                        </h2>
                    </div>
                </RevealSection>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {painPoints.map((point, i) => (
                        <RevealSection key={i} delay={i * 80}>
                            <div className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#ea3382]/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="w-10 h-10 rounded-xl bg-[#ea3382]/10 border border-[#ea3382]/20 flex items-center justify-center mb-4 group-hover:bg-[#ea3382]/20 transition-colors">
                                    <point.icon className="h-5 w-5 text-[#ea3382]" />
                                </div>
                                <p className="text-zinc-300 leading-relaxed">{point.text}</p>
                            </div>
                        </RevealSection>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ───────────────────────────── Features ───────────────────────────── */

const features = [
    {
        icon: LayoutDashboard,
        title: "Smart Media Card",
        desc: "A beautiful, always-up-to-date digital media card with your stats, audience demographics, past collaborations, and rates. Share it with brands via a single link. No more PDFs that are out of date before you've even sent them.",
        gradient: "from-[#ea3382] to-[#c026d3]",
    },
    {
        icon: Send,
        title: "Brand Outreach Pipeline",
        desc: "Proactively pitch brands you actually want to work with. Generate personalised outreach emails, send automated follow-ups, and track every conversation from first email to reply. Stop waiting to be discovered.",
        gradient: "from-[#8b5cf6] to-[#6366f1]",
    },
    {
        icon: Brain,
        title: "AI Pitch Proposals",
        desc: "Generate custom pitch proposals in minutes — tailored to the brand's product, packed with your audience data, and laid out professionally. Close deals faster than creators with full management teams.",
        gradient: "from-[#06b6d4] to-[#0891b2]",
    },
    {
        icon: Users,
        title: "CRM & Deal Tracker",
        desc: "Every brand relationship in one place. See exactly where every deal stands — pitched, negotiating, contracted, delivered, paid. Never lose track of an opportunity again.",
        gradient: "from-[#f59e0b] to-[#d97706]",
    },
    {
        icon: Handshake,
        title: "Contract & Negotiation Tools",
        desc: "Handle rate negotiations with confidence. Get suggested rates based on your actual metrics, use professional templates, and track every contract. Stop guessing, stop undercharging.",
        gradient: "from-[#10b981] to-[#059669]",
    },
    {
        icon: CalendarCheck,
        title: "Campaign Management",
        desc: "Track deliverables, deadlines, content approvals, and posting schedules for every active partnership. Know exactly what's due, when, and for whom.",
        gradient: "from-[#ec4899] to-[#db2777]",
    },
    {
        icon: Receipt,
        title: "Invoice & Payment Tracking",
        desc: "Generate professional invoices, track payment status, and set reminders for overdue payments. Never awkwardly chase a brand for money again.",
        gradient: "from-[#f97316] to-[#ea580c]",
    },
];

function Features() {
    return (
        <section id="features" className="relative py-24 md:py-32 bg-[#0d0d10]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.05),_transparent_60%)]" />
            <div className="relative z-10 max-w-6xl mx-auto px-6">
                <RevealSection>
                    <div className="text-center mb-20">
                        <p className="text-sm font-medium text-[#ea3382] tracking-wide uppercase mb-3">
                            Everything you need
                        </p>
                        <h2 className="text-3xl md:text-5xl font-heading font-semibold text-white mb-4">
                            One dashboard.{" "}
                            <span className="bg-gradient-to-r from-[#ea3382] to-[#c026d3] bg-clip-text text-transparent">
                                Total control.
                            </span>
                        </h2>
                        <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                            Professional-grade tools that give you everything a talent manager
                            provides — without giving up 20% of your income.
                        </p>
                    </div>
                </RevealSection>

                <div className="space-y-6">
                    {features.map((feature, i) => {
                        const isEven = i % 2 === 0;
                        return (
                            <RevealSection key={i} delay={i * 60}>
                                <div
                                    className={`group flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"
                                        } gap-6 md:gap-10 items-center p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300`}
                                >
                                    {/* Feature visual */}
                                    <div className="w-full md:w-2/5 flex-shrink-0">
                                        <div
                                            className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${feature.gradient} opacity-[0.08] group-hover:opacity-[0.12] transition-opacity relative overflow-hidden`}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <feature.icon className="h-16 w-16 text-white opacity-40" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Feature text */}
                                    <div className="flex-1">
                                        <div
                                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}
                                        >
                                            <feature.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-heading font-semibold text-white mb-3">
                                            {feature.title}
                                        </h3>
                                        <p className="text-zinc-400 leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            </RevealSection>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* ───────────────────────────── Founder ───────────────────────────── */

function Founder() {
    return (
        <section id="founder" className="relative py-24 md:py-32 bg-[#0a0a0c]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(234,51,130,0.06),_transparent_50%)]" />
            <div className="relative z-10 max-w-6xl mx-auto px-6">
                <RevealSection>
                    <p className="text-sm font-medium text-[#ea3382] tracking-wide uppercase mb-3 text-center md:text-left">
                        The Story
                    </p>
                    <h2 className="text-3xl md:text-5xl font-heading font-semibold text-white mb-16 text-center md:text-left">
                        Built by a creator{" "}
                        <span className="text-zinc-500">who gets it.</span>
                    </h2>
                </RevealSection>

                <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
                    {/* Photo placeholder */}
                    <RevealSection className="w-full md:w-2/5 flex-shrink-0">
                        <div className="relative">
                            <div className="absolute -inset-3 bg-gradient-to-br from-[#ea3382]/20 to-[#c026d3]/10 rounded-2xl blur-xl" />
                            <div className="relative aspect-[3/4] rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 overflow-hidden flex items-end justify-center p-8">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="relative z-10 text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ea3382] to-[#c026d3] mx-auto mb-4 flex items-center justify-center">
                                        <Sparkles className="h-8 w-8 text-white" />
                                    </div>
                                    {/* Trust signal badges */}
                                    <div className="flex items-center justify-center gap-3 flex-wrap">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs text-zinc-300 border border-white/10">
                                            <Tv className="h-3 w-3" /> BBC Featured
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs text-zinc-300 border border-white/10">
                                            <Award className="h-3 w-3" /> Award-Winning
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealSection>

                    {/* Founder copy */}
                    <RevealSection delay={150} className="flex-1">
                        <div className="space-y-5 text-zinc-400 text-lg leading-relaxed">
                            <p>
                                This platform wasn&apos;t dreamed up in a boardroom. It was born
                                out of 15+ years in the creator industry — years spent on
                                camera, behind the scenes, pitching global brands, negotiating
                                deals, and building a career from scratch without a management
                                team.
                            </p>
                            <p>
                                The founder has appeared on the{" "}
                                <span className="text-white font-medium">
                                    BBC multiple times
                                </span>
                                , won awards for content creation, and worked directly with some
                                of the biggest brands in the world. Not as an agency middleman —
                                as the talent. The one writing the emails, chasing the invoices,
                                tracking deals in a messy spreadsheet, and wondering why there
                                wasn&apos;t a better way.
                            </p>
                            <p>
                                Every frustration this platform solves has been{" "}
                                <span className="text-white font-medium">
                                    personally lived
                                </span>
                                . The ignored outreach emails. The awkward rate negotiations. The
                                deals that slipped away because of a missed follow-up. The
                                feeling of being less professional than creators who had a team
                                behind them.
                            </p>
                            <p className="text-white text-xl font-heading">
                                This isn&apos;t a tech company guessing what influencers need.
                                It&apos;s a creator who got tired of the broken system and built
                                the solution.
                            </p>
                        </div>
                    </RevealSection>
                </div>
            </div>
        </section>
    );
}

/* ───────────────────────────── Social Proof ───────────────────────────── */

const testimonials = [
    {
        name: "Sarah K.",
        handle: "@sarahcreates",
        text: "I went from chasing brands in DMs to having a professional pipeline. My income doubled in three months.",
        followers: "45K followers",
    },
    {
        name: "Marcus J.",
        handle: "@marcusjvlogs",
        text: "The AI pitch proposals alone are worth it. I'm closing deals in days that used to take weeks of back-and-forth.",
        followers: "120K followers",
    },
    {
        name: "Priya R.",
        handle: "@priyastyle",
        text: "Finally I look as professional as creators with full management teams — without giving up 20% of my income.",
        followers: "89K followers",
    },
];

function SocialProof() {
    return (
        <section className="relative py-24 md:py-32 bg-[#0d0d10]">
            <div className="relative z-10 max-w-6xl mx-auto px-6">
                <RevealSection>
                    <div className="text-center mb-4">
                        <p className="text-sm font-medium text-[#ea3382] tracking-wide uppercase mb-3">
                            Trusted by creators
                        </p>
                        <h2 className="text-3xl md:text-5xl font-heading font-semibold text-white mb-4">
                            Creators are taking control.
                        </h2>
                        <p className="text-zinc-500 text-lg">
                            Join thousands of self-managed creators already using My Little
                            Agent.
                        </p>
                    </div>
                </RevealSection>

                {/* Counter */}
                <RevealSection delay={100}>
                    <div className="flex items-center justify-center gap-8 mt-8 mb-16">
                        {[
                            { num: "2,500+", label: "Creators" },
                            { num: "£4.2M+", label: "Deals Tracked" },
                            { num: "12,000+", label: "Pitches Sent" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl md:text-3xl font-heading font-semibold text-white">
                                    {stat.num}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </RevealSection>

                {/* Testimonials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <RevealSection key={i} delay={i * 100}>
                            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300 h-full flex flex-col">
                                <div className="flex items-center gap-1 text-[#ea3382] mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="h-4 w-4 fill-current" />
                                    ))}
                                </div>
                                <p className="text-zinc-300 leading-relaxed mb-6 flex-1">
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ea3382]/30 to-[#c026d3]/20 border border-white/10" />
                                    <div>
                                        <div className="text-sm font-medium text-white">
                                            {t.name}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {t.handle} · {t.followers}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RevealSection>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ───────────────────────────── Who Is This For ───────────────────────────── */

function WhoIsThisFor() {
    const forYou = [
        "You're a self-managed creator doing everything yourself",
        "You're tired of leaving money on the table",
        "You want to pitch brands proactively, not wait to be found",
        "You want to look professional and be taken seriously",
        "You want the tools of a management team without giving up 20%",
    ];
    const notForYou = [
        "You already have a full-service talent manager handling everything",
        "You're not interested in brand partnerships",
        "You're looking for a follower growth or scheduling tool",
    ];

    return (
        <section className="relative py-24 md:py-32 bg-[#0a0a0c]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(234,51,130,0.05),_transparent_50%)]" />
            <div className="relative z-10 max-w-5xl mx-auto px-6">
                <RevealSection>
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium text-[#ea3382] tracking-wide uppercase mb-3">
                            Is this right for you?
                        </p>
                        <h2 className="text-3xl md:text-5xl font-heading font-semibold text-white">
                            Who is this for?
                        </h2>
                    </div>
                </RevealSection>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RevealSection>
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#ea3382]/5 to-transparent border border-[#ea3382]/10 h-full">
                            <h3 className="text-lg font-heading font-semibold text-white mb-6 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#ea3382]/20 flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-[#ea3382]" />
                                </div>
                                This is for you if…
                            </h3>
                            <ul className="space-y-4">
                                {forYou.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-[#ea3382] flex-shrink-0 mt-0.5" />
                                        <span className="text-zinc-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </RevealSection>

                    <RevealSection delay={100}>
                        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 h-full">
                            <h3 className="text-lg font-heading font-semibold text-white mb-6 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                                    <X className="h-3.5 w-3.5 text-zinc-400" />
                                </div>
                                This probably isn&apos;t for you if…
                            </h3>
                            <ul className="space-y-4">
                                {notForYou.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <X className="h-5 w-5 text-zinc-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-zinc-500">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </RevealSection>
                </div>
            </div>
        </section>
    );
}

/* ───────────────────────────── Pricing ───────────────────────────── */

const plans = [
    {
        name: "Starter",
        price: "Free",
        desc: "Get started and see what's possible.",
        features: [
            "Smart Media Card",
            "Up to 5 brand contacts",
            "Basic CRM view",
            "1 pitch proposal / month",
        ],
        cta: "Get Started Free",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "£19",
        period: "/mo",
        desc: "Everything you need to run your creator business.",
        features: [
            "Everything in Starter",
            "Unlimited brand contacts",
            "Full outreach pipeline",
            "Unlimited AI pitch proposals",
            "Contract templates",
            "Invoice & payment tracking",
            "Campaign management",
            "Priority support",
        ],
        cta: "Start Free Trial",
        highlighted: true,
    },
    {
        name: "Business",
        price: "£39",
        period: "/mo",
        desc: "For established creators scaling their business.",
        features: [
            "Everything in Pro",
            "Advanced analytics",
            "Custom branding on media card",
            "Multi-platform stats sync",
            "Dedicated account manager",
            "API access",
            "Early access to new features",
        ],
        cta: "Start Free Trial",
        highlighted: false,
    },
];

function Pricing() {
    return (
        <section id="pricing" className="relative py-24 md:py-32 bg-[#0d0d10]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.06),_transparent_50%)]" />
            <div className="relative z-10 max-w-6xl mx-auto px-6">
                <RevealSection>
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium text-[#ea3382] tracking-wide uppercase mb-3">
                            Pricing
                        </p>
                        <h2 className="text-3xl md:text-5xl font-heading font-semibold text-white mb-4">
                            Start free.{" "}
                            <span className="text-zinc-500">
                                Upgrade when you&apos;re ready.
                            </span>
                        </h2>
                        <p className="text-zinc-500 text-lg">
                            No contracts. Cancel anytime. Your success pays for itself.
                        </p>
                    </div>
                </RevealSection>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <RevealSection key={i} delay={i * 100}>
                            <div
                                className={`relative p-8 rounded-2xl border h-full flex flex-col ${plan.highlighted
                                    ? "bg-gradient-to-b from-[#ea3382]/10 to-transparent border-[#ea3382]/30 shadow-xl shadow-[#ea3382]/5"
                                    : "bg-white/[0.02] border-white/5"
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#ea3382] to-[#c026d3] text-xs font-semibold text-white">
                                        Most Popular
                                    </div>
                                )}
                                <div className="mb-6">
                                    <h3 className="text-lg font-heading font-semibold text-white mb-1">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-zinc-500 mb-4">{plan.desc}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-heading font-semibold text-white">
                                            {plan.price}
                                        </span>
                                        {plan.period && (
                                            <span className="text-zinc-500">{plan.period}</span>
                                        )}
                                    </div>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((f, j) => (
                                        <li
                                            key={j}
                                            className="flex items-start gap-2.5 text-sm text-zinc-400"
                                        >
                                            <Check className="h-4 w-4 text-[#ea3382] flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register"
                                    className={`block text-center w-full py-3 rounded-xl font-medium text-sm transition-all ${plan.highlighted
                                        ? "bg-gradient-to-r from-[#ea3382] to-[#c026d3] text-white hover:opacity-90 shadow-lg shadow-[#ea3382]/20"
                                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        </RevealSection>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ───────────────────────────── Final CTA ───────────────────────────── */

function FinalCTA() {
    return (
        <section className="relative py-24 md:py-32 bg-[#0a0a0c] overflow-hidden">
            {/* Background radials */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(234,51,130,0.12),_transparent_50%)]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ea3382]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c026d3]/5 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                <RevealSection>
                    <h2 className="text-3xl md:text-5xl font-heading font-semibold text-white leading-tight mb-6">
                        Go from chasing brands in DMs to running a{" "}
                        <span className="bg-gradient-to-r from-[#ea3382] to-[#c026d3] bg-clip-text text-transparent">
                            professional creator business.
                        </span>
                    </h2>
                </RevealSection>
                <RevealSection delay={100}>
                    <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
                        Your career is too important to run on spreadsheets and DMs. Take
                        full ownership of your influencer business — starting today.
                    </p>
                </RevealSection>
                <RevealSection delay={200}>
                    <Link
                        href="/register"
                        className="group inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-[#ea3382] to-[#c026d3] text-white font-semibold text-lg hover:opacity-90 transition-all shadow-2xl shadow-[#ea3382]/30 hover:shadow-[#ea3382]/50 hover:scale-[1.02]"
                    >
                        Get Started Free
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <p className="text-sm text-zinc-600 mt-4">
                        No credit card required · Free plan available
                    </p>
                </RevealSection>
            </div>
        </section>
    );
}

/* ───────────────────────────── Footer ───────────────────────────── */

function LandingFooter() {
    return (
        <footer className="border-t border-white/5 bg-[#08080a] py-12">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ea3382] to-[#c026d3] flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-heading font-semibold text-white">
                            My Little Agent
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm text-zinc-600">
                        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-zinc-400 transition-colors">
                            Terms
                        </Link>
                        <a href="mailto:hello@mylittleagent.co" className="hover:text-zinc-400 transition-colors">
                            Support
                        </a>
                    </div>

                    {/* Social */}
                    <div className="flex items-center gap-4">
                        {[
                            { name: "Twitter", path: "/social-icons/twitter.svg" },
                            { name: "Instagram", path: "/social-icons/instagram.svg" },
                            { name: "YouTube", path: "/social-icons/youtube.svg" },
                            { name: "LinkedIn", path: "/social-icons/linkedin.svg" },
                        ].map((social, i) => (
                            <a
                                key={i}
                                href="#"
                                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all opacity-80 hover:opacity-100 p-1.5"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={social.path} alt={social.name} className="w-full h-full object-contain" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 text-center text-xs text-zinc-700">
                    © {new Date().getFullYear()} My Little Agent. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

/* ───────────────────────────── Main Export ───────────────────────────── */

export default function LandingPage() {
    return (
        <div className="bg-[#0a0a0c] text-white min-h-screen selection:bg-[#ea3382]/30">
            <Nav />
            <Hero />
            <PainPoints />
            <Features />
            <Founder />
            <SocialProof />
            <WhoIsThisFor />
            <Pricing />
            <FinalCTA />
            <LandingFooter />
        </div>
    );
}
