"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ImproveWithAI } from "@/components/ui/improve-with-ai";
import {
    Sparkles,
    Building,
    Globe,
    Users,
    Award,
    MessageSquare,
    CreditCard,
    DollarSign,
    Mail,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    X,
    Plus,
    SkipForward,
    Bot,
    ExternalLink,
    Loader2,
    ShieldCheck,
    AlertCircle,
    Save,
} from "lucide-react";

const STEPS = [
    { id: "ai_setup", label: "AI Manager", icon: Bot },
    { id: "brand", label: "Brand Name", icon: Building },
    { id: "profile", label: "Brand Profile", icon: Sparkles },
    { id: "platforms", label: "Platforms", icon: Globe },
    { id: "audience", label: "Audience", icon: Users },
    { id: "casestudies", label: "Past Work", icon: Award },
    { id: "testimonials", label: "Testimonials", icon: MessageSquare },
    { id: "business", label: "Business Details", icon: CreditCard },
    { id: "ratecard", label: "Rate Card", icon: DollarSign },
    { id: "email", label: "Email Setup", icon: Mail },
    { id: "done", label: "Done", icon: CheckCircle2 },
];

type OnboardingData = {
    brandName: string;
    website: string;
    tagline: string;
    bio: string;
    location: string;
    contactEmail: string;
    toneOfVoice: string;
    contentCategories: string[];
    keyDifferentiators: string;
    platforms: {
        type: string;
        handle: string;
        followers: string;
        avgViews: string;
        engagementRate: string;
    }[];
    audienceSummary: string;
    caseStudies: {
        brandName: string;
        industry: string;
        brief: string;
        result: string;
        contentUrl: string;
    }[];
    testimonials: {
        quote: string;
        authorName: string;
        authorTitle: string;
        company: string;
    }[];
    previousBrands: string[];
    businessName: string;
    businessAddress: string;
    vatNumber: string;
    bankDetails: string;
    paymentTerms: string;
    currency: string;
    rateCard: string;
    anthropicApiKey: string;
    aiManagerName: string;
    emailFromName: string;
    emailSignature: string;
};

const initialData: OnboardingData = {
    brandName: "",
    website: "",
    tagline: "",
    bio: "",
    location: "",
    contactEmail: "",
    toneOfVoice: "",
    contentCategories: [],
    keyDifferentiators: "",
    platforms: [],
    audienceSummary: "",
    caseStudies: [],
    testimonials: [],
    previousBrands: [],
    businessName: "",
    businessAddress: "",
    vatNumber: "",
    bankDetails: "",
    paymentTerms: "net-30",
    currency: "GBP",
    rateCard: "",
    anthropicApiKey: "",
    aiManagerName: "AI Manager",
    emailFromName: "",
    emailSignature: "",
};

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(initialData);
    const [saving, setSaving] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [apiKeyTesting, setApiKeyTesting] = useState(false);
    const [apiKeyStatus, setApiKeyStatus] = useState<"idle" | "valid" | "invalid">("idle");
    const [apiKeyError, setApiKeyError] = useState("");
    const [hasExistingApiKey, setHasExistingApiKey] = useState(false);
    const [savedSteps, setSavedSteps] = useState<Set<string>>(new Set());

    // Map onboarding step IDs to dashboard step names for progress tracking
    const stepToProgressName: Record<string, string> = {
        brand: "Brand Profile", profile: "Brand Profile",
        platforms: "Platforms", audience: "Audience",
        casestudies: "Past Work", testimonials: "Testimonials",
        business: "Business Details", ratecard: "Rate Card",
        ai_setup: "AI Manager", email: "Email Setup",
    };

    // Fetch real progress from API on mount
    useEffect(() => {
        fetch("/api/setup-progress")
            .then((r) => r.json())
            .then((d) => {
                if (d.steps) {
                    const completed = new Set<string>();
                    Object.entries(d.steps).forEach(([name, done]) => {
                        if (done) completed.add(name);
                    });
                    setSavedSteps(completed);
                }
            })
            .catch(() => { });
    }, []);

    // Check if user already has an API key configured
    useEffect(() => {
        fetch("/api/settings/api-key")
            .then((r) => r.json())
            .then((d) => {
                if (d.hasKey) {
                    setHasExistingApiKey(true);
                    setApiKeyStatus("valid");
                }
            })
            .catch(() => { });
    }, []);

    // Load existing data from the API to pre-fill forms
    useEffect(() => {
        fetch("/api/onboarding")
            .then((r) => r.ok ? r.json() : null)
            .then((existing) => {
                if (existing) {
                    setData((prev) => ({
                        ...prev,
                        ...existing,
                        // Don't overwrite anthropicApiKey — it's always "" from the API for security
                        anthropicApiKey: prev.anthropicApiKey,
                    }));
                }
            })
            .catch(() => { });
    }, []);

    // Progress based on actual saved steps (9 total dashboard steps)
    const totalSteps = 9;
    const completedCount = savedSteps.size;
    const progress = Math.round((completedCount / totalSteps) * 100);

    const updateData = useCallback(
        (fields: Partial<OnboardingData>) => {
            setData((prev) => ({ ...prev, ...fields }));
        },
        []
    );

    const addPlatform = () => {
        updateData({
            platforms: [
                ...data.platforms,
                { type: "youtube", handle: "", followers: "", avgViews: "", engagementRate: "" },
            ],
        });
    };

    const removePlatform = (index: number) => {
        updateData({
            platforms: data.platforms.filter((_, i) => i !== index),
        });
    };

    const updatePlatform = (index: number, field: string, value: string) => {
        const updated = [...data.platforms];
        updated[index] = { ...updated[index], [field]: value };
        updateData({ platforms: updated });
    };

    const addCaseStudy = () => {
        updateData({
            caseStudies: [
                ...data.caseStudies,
                { brandName: "", industry: "", brief: "", result: "", contentUrl: "" },
            ],
        });
    };

    const removeCaseStudy = (index: number) => {
        updateData({
            caseStudies: data.caseStudies.filter((_, i) => i !== index),
        });
    };

    const addTestimonial = () => {
        updateData({
            testimonials: [
                ...data.testimonials,
                { quote: "", authorName: "", authorTitle: "", company: "" },
            ],
        });
    };

    const removeTestimonial = (index: number) => {
        updateData({
            testimonials: data.testimonials.filter((_, i) => i !== index),
        });
    };

    const addCategory = () => {
        if (newCategory.trim() && !data.contentCategories.includes(newCategory.trim())) {
            updateData({ contentCategories: [...data.contentCategories, newCategory.trim()] });
            setNewCategory("");
        }
    };

    const removeCategory = (cat: string) => {
        updateData({ contentCategories: data.contentCategories.filter((c) => c !== cat) });
    };

    const [newBrand, setNewBrand] = useState("");

    const addBrand = () => {
        const parts = newBrand.split(",").map((b) => b.trim()).filter(Boolean);
        const toAdd = parts.filter((b) => !data.previousBrands.includes(b));
        if (toAdd.length > 0) {
            updateData({ previousBrands: [...data.previousBrands, ...toAdd] });
            setNewBrand("");
        }
    };

    const removeBrand = (brand: string) => {
        updateData({ previousBrands: data.previousBrands.filter((b) => b !== brand) });
    };

    const saveAndContinue = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: STEPS[currentStep].id, data }),
            });

            if (res.ok) {
                toast.success("Step saved!", { description: `${STEPS[currentStep].label} has been saved.` });

                // Re-fetch real progress from the API instead of optimistic marking
                try {
                    const progressRes = await fetch("/api/setup-progress");
                    const progressData = await progressRes.json();
                    if (progressData.steps) {
                        const completed = new Set<string>();
                        Object.entries(progressData.steps).forEach(([name, done]) => {
                            if (done) completed.add(name);
                        });
                        setSavedSteps(completed);
                    }
                } catch { /* proceed anyway */ }

                // Advance to next step
                if (currentStep < STEPS.length - 1) {
                    setCurrentStep((prev) => prev + 1);
                } else {
                    router.push("/dashboard");
                }
            } else {
                const err = await res.json().catch(() => null);
                toast.error("Failed to save", { description: err?.error || "Please try again." });
            }
        } catch (error) {
            console.error("Failed to save onboarding data:", error);
            toast.error("Failed to save", { description: "Network error — please try again." });
        } finally {
            setSaving(false);
        }
    };

    const skip = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const goBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar Progress */}
            <div className="w-72 border-r bg-card p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                    <div className="h-10 w-10 flex items-center justify-center shrink-0">
                        <video src="/robot.webm" autoPlay loop muted playsInline className="w-full h-full object-contain" />
                    </div>
                    <span className="text-lg font-heading font-semibold">My Little Agent</span>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white text-sm font-heading font-bold shrink-0">
                        {progress}%
                    </div>
                    <div className="flex-1">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {completedCount} of {totalSteps} saved · {progress}%
                        </p>
                    </div>
                </div>

                <nav className="space-y-1 flex-1">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const progressName = stepToProgressName[step.id];
                        const isSaved = progressName ? savedSteps.has(progressName) : false;

                        return (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(index)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${isActive
                                    ? "bg-brand/10 text-brand font-medium"
                                    : isSaved
                                        ? "text-foreground hover:bg-accent"
                                        : "text-muted-foreground hover:bg-accent/50"
                                    }`}
                            >
                                {isSaved ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                                {step.label}
                            </button>
                        );
                    })}
                </nav>

                <Button
                    variant="ghost"
                    className="justify-start text-muted-foreground"
                    onClick={() => router.push("/dashboard")}
                >
                    Skip setup — go to dashboard
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-2xl">
                    {/* Step 1: AI Manager Setup */}
                    {currentStep === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-2xl">
                                    Set up your AI Manager
                                </CardTitle>
                                <CardDescription>
                                    Your AI Manager is powered by Claude (by Anthropic). Add your API key to
                                    unlock AI-powered pitch generation, contract drafting, and your personal AI talent manager.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Already configured banner */}
                                {hasExistingApiKey && (
                                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                                        <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-green-800">API key already configured!</p>
                                            <p className="text-xs text-green-600 mt-0.5">Your AI Manager is ready to go. You can update your key in Settings → AI anytime.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Name your AI Manager */}
                                <div className="space-y-2">
                                    <Label htmlFor="aiManagerName">Name your AI Manager</Label>
                                    <Input
                                        id="aiManagerName"
                                        placeholder="e.g. Jasper, My Agent, Ally..."
                                        value={data.aiManagerName}
                                        onChange={(e) => updateData({ aiManagerName: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Give your AI assistant a name — it&apos;ll appear in the chat panel.</p>
                                </div>

                                {/* What it powers */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Pitch Generator", desc: "Personalised outreach emails" },
                                        { label: "Contract Drafter", desc: "Professional agreements" },
                                        { label: "AI Manager Agent", desc: "Your personal AI talent manager" },
                                    ].map((item) => (
                                        <div key={item.label} className="border rounded-lg p-3 text-center">
                                            <Bot className="h-5 w-5 mx-auto mb-1.5 text-brand" />
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {!hasExistingApiKey && (
                                    <>
                                        <Separator />

                                        {/* Step-by-step instructions */}
                                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                            <p className="text-sm font-medium">How to get your API key:</p>
                                            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                                <li>Create a free account at{" "}
                                                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                                                        className="text-brand hover:underline inline-flex items-center gap-1">
                                                        console.anthropic.com <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </li>
                                                <li>Add billing (pay-as-you-go — no minimum)</li>
                                                <li>Go to API Keys → Create a new key</li>
                                                <li>Paste it below</li>
                                            </ol>
                                        </div>

                                        {/* Cost estimates */}
                                        <div className="flex items-start gap-3 bg-brand/5 border border-brand/20 rounded-lg p-4">
                                            <ShieldCheck className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                                            <div className="text-sm">
                                                <p className="font-medium text-brand">Typical cost: £3-10/month</p>
                                                <p className="text-muted-foreground mt-1">
                                                    A pitch email costs ~£0.01, a contract ~£0.03, and AI manager conversations ~£0.02-0.05 each.
                                                    Your key is encrypted and stored securely — we never see it in plain text.
                                                </p>
                                            </div>
                                        </div>

                                        {/* API Key Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="apiKey">Anthropic API Key</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="apiKey"
                                                    type="password"
                                                    placeholder="sk-ant-..."
                                                    value={data.anthropicApiKey}
                                                    onChange={(e) => {
                                                        updateData({ anthropicApiKey: e.target.value });
                                                        setApiKeyStatus("idle");
                                                        setApiKeyError("");
                                                    }}
                                                    className={apiKeyStatus === "valid" ? "border-green-500" : apiKeyStatus === "invalid" ? "border-red-500" : ""}
                                                />
                                                <Button
                                                    variant="outline"
                                                    disabled={!data.anthropicApiKey || apiKeyTesting}
                                                    onClick={async () => {
                                                        setApiKeyTesting(true);
                                                        setApiKeyError("");
                                                        try {
                                                            const res = await fetch("/api/settings/api-key", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ apiKey: data.anthropicApiKey }),
                                                            });
                                                            if (res.ok) {
                                                                setApiKeyStatus("valid");
                                                                setHasExistingApiKey(true);
                                                            } else {
                                                                const err = await res.json();
                                                                setApiKeyStatus("invalid");
                                                                setApiKeyError(err.error || "Invalid API key");
                                                            }
                                                        } catch {
                                                            setApiKeyStatus("invalid");
                                                            setApiKeyError("Network error — couldn't test the key");
                                                        } finally {
                                                            setApiKeyTesting(false);
                                                        }
                                                    }}
                                                    className="shrink-0 gap-2"
                                                >
                                                    {apiKeyTesting ? (
                                                        <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</>
                                                    ) : (
                                                        "Test Connection"
                                                    )}
                                                </Button>
                                            </div>
                                            {apiKeyStatus === "valid" && !hasExistingApiKey && (
                                                <p className="text-sm text-green-600 flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-4 w-4" /> API key is valid and saved!
                                                </p>
                                            )}
                                            {apiKeyStatus === "invalid" && apiKeyError && (
                                                <p className="text-sm text-red-600 flex items-center gap-1.5">
                                                    <AlertCircle className="h-4 w-4" /> {apiKeyError}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Brand Name & Website */}
                    {currentStep === 1 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-brand via-purple-400 to-pink-400" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">🏠</div>
                                <CardTitle className="font-heading text-2xl">
                                    What&apos;s your brand called?
                                </CardTitle>
                                <CardDescription className="text-base">
                                    This is how brands will see you in pitches, contracts, and invoices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="brandName" className="text-sm font-medium">Brand / Creator Name</Label>
                                    <Input
                                        id="brandName"
                                        placeholder="e.g. The Michalaks"
                                        value={data.brandName}
                                        onChange={(e) => updateData({ brandName: e.target.value })}
                                        className="h-12 text-lg"
                                    />
                                    <p className="text-xs text-muted-foreground">This can be your real name, channel name, or company name.</p>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-sm font-medium">Website <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        placeholder="https://www.yoursite.com"
                                        value={data.website}
                                        onChange={(e) => updateData({ website: e.target.value })}
                                    />
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                                    <span className="text-lg mt-0.5">💡</span>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        <strong>Tip:</strong> Use the name brands already know you by — it&apos;ll be used in every pitch, contract, and invoice your AI generates.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Brand Profile */}
                    {currentStep === 2 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-purple-400 via-brand to-emerald-400" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">✨</div>
                                <CardTitle className="font-heading text-2xl">
                                    Tell us about your brand
                                </CardTitle>
                                <CardDescription className="text-base">
                                    This powers your AI pitches and media kit.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="tagline" className="text-sm font-medium">Tagline</Label>
                                    <Input
                                        id="tagline"
                                        placeholder="e.g. Story-Driven Content Creators"
                                        value={data.tagline}
                                        onChange={(e) => updateData({ tagline: e.target.value })}
                                    />
                                    <ImproveWithAI
                                        value={data.tagline}
                                        onImproved={(text) => updateData({ tagline: text })}
                                        fieldType="tagline"
                                        disabled={!hasExistingApiKey}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        rows={4}
                                        placeholder="Who you are, what you create, what makes you unique..."
                                        value={data.bio}
                                        onChange={(e) => updateData({ bio: e.target.value })}
                                        className="resize-none"
                                    />
                                    <ImproveWithAI
                                        value={data.bio}
                                        onImproved={(text) => updateData({ bio: text })}
                                        fieldType="bio"
                                        disabled={!hasExistingApiKey}
                                    />
                                </div>
                                <Separator />
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">📍 Contact &amp; Location</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            placeholder="e.g. London, UK"
                                            value={data.location}
                                            onChange={(e) => updateData({ location: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail">Contact Email</Label>
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={data.contactEmail}
                                            onChange={(e) => updateData({ contactEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🎨 Voice &amp; Positioning</p>
                                <div className="space-y-2">
                                    <Label htmlFor="toneOfVoice">Tone of Voice</Label>
                                    <Input
                                        id="toneOfVoice"
                                        placeholder="e.g. Warm, authentic, cinematic"
                                        value={data.toneOfVoice}
                                        onChange={(e) => updateData({ toneOfVoice: e.target.value })}
                                    />
                                    <div className="bg-brand/5 border border-brand/20 rounded-lg p-3 flex items-start gap-2">
                                        <Sparkles className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                                        <p className="text-xs text-muted-foreground">
                                            Your AI will use this to match your style in pitches and email outreach.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Content Categories</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {data.contentCategories.map((cat) => (
                                            <Badge key={cat} variant="secondary" className="gap-1.5 pl-3 pr-1.5 py-1.5">
                                                {cat}
                                                <button onClick={() => removeCategory(cat)} className="hover:bg-foreground/10 rounded p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add category..."
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                                            className="max-w-xs"
                                        />
                                        <Button variant="outline" size="sm" onClick={addCategory}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="keyDiffs">Key Differentiators</Label>
                                    <Textarea
                                        id="keyDiffs"
                                        rows={3}
                                        placeholder="What sets you apart from other creators?"
                                        value={data.keyDifferentiators}
                                        onChange={(e) => updateData({ keyDifferentiators: e.target.value })}
                                        className="resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 4: Platforms */}
                    {currentStep === 3 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-blue-400 via-brand to-purple-400" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">📱</div>
                                <CardTitle className="font-heading text-2xl">
                                    Where are you active?
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Add your social platforms and current stats. These appear in pitches and media kits.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.platforms.map((platform, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                                        <button
                                            onClick={() => removePlatform(index)}
                                            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Platform</Label>
                                                <select
                                                    value={platform.type}
                                                    onChange={(e) => updatePlatform(index, "type", e.target.value)}
                                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                                >
                                                    <option value="youtube">YouTube</option>
                                                    <option value="instagram">Instagram</option>
                                                    <option value="tiktok">TikTok</option>
                                                    <option value="twitter">X/Twitter</option>
                                                    <option value="facebook">Facebook</option>
                                                    <option value="linkedin">LinkedIn</option>
                                                    <option value="podcast">Podcast</option>
                                                    <option value="blog">Blog</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Handle / URL</Label>
                                                <Input
                                                    placeholder="@yourhandle"
                                                    value={platform.handle}
                                                    onChange={(e) => updatePlatform(index, "handle", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Followers</Label>
                                                <Input
                                                    placeholder="e.g. 680000"
                                                    value={platform.followers}
                                                    onChange={(e) => updatePlatform(index, "followers", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Avg Views</Label>
                                                <Input
                                                    placeholder="e.g. 85000"
                                                    value={platform.avgViews}
                                                    onChange={(e) => updatePlatform(index, "avgViews", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Engagement Rate</Label>
                                                <Input
                                                    placeholder="e.g. 4.2"
                                                    value={platform.engagementRate}
                                                    onChange={(e) => updatePlatform(index, "engagementRate", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addPlatform} className="w-full gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Platform
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 5: Audience Demographics */}
                    {currentStep === 4 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-brand to-blue-400" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">👥</div>
                                <CardTitle className="font-heading text-2xl">
                                    Who&apos;s your audience?
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Summarise your audience demographics. This helps AI craft relevant pitches.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="audience">Audience Summary</Label>
                                    <Textarea
                                        id="audience"
                                        rows={6}
                                        placeholder={`e.g.\n• 65% Female, 35% Male\n• Core age: 25-44 (72%)\n• Top countries: UK (45%), USA (18%), Australia (8%)\n• Interests: Family lifestyle, travel, fashion, home decor`}
                                        value={data.audienceSummary}
                                        onChange={(e) => updateData({ audienceSummary: e.target.value })}
                                        className="resize-none"
                                    />
                                    <ImproveWithAI
                                        value={data.audienceSummary}
                                        onImproved={(text) => updateData({ audienceSummary: text })}
                                        fieldType="audienceSummary"
                                        disabled={!hasExistingApiKey}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tip: Pull this from your YouTube/Instagram analytics.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 6: Past Work / Case Studies */}
                    {currentStep === 5 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-brand" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">🏆</div>
                                <CardTitle className="font-heading text-2xl">
                                    Show off your best work
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Add past campaigns that demonstrate your value. These are included in AI-generated pitches.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.caseStudies.map((cs, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                                        <button
                                            onClick={() => removeCaseStudy(index)}
                                            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Brand Name</Label>
                                                <Input
                                                    placeholder="e.g. Land Rover"
                                                    value={cs.brandName}
                                                    onChange={(e) => {
                                                        const updated = [...data.caseStudies];
                                                        updated[index] = { ...updated[index], brandName: e.target.value };
                                                        updateData({ caseStudies: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Industry</Label>
                                                <Input
                                                    placeholder="e.g. Automotive"
                                                    value={cs.industry}
                                                    onChange={(e) => {
                                                        const updated = [...data.caseStudies];
                                                        updated[index] = { ...updated[index], industry: e.target.value };
                                                        updateData({ caseStudies: updated });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Campaign Brief</Label>
                                            <Textarea
                                                rows={2}
                                                placeholder="What was the campaign about?"
                                                value={cs.brief}
                                                onChange={(e) => {
                                                    const updated = [...data.caseStudies];
                                                    updated[index] = { ...updated[index], brief: e.target.value };
                                                    updateData({ caseStudies: updated });
                                                }}
                                                className="resize-none"
                                            />
                                            <ImproveWithAI
                                                value={cs.brief}
                                                onImproved={(text) => {
                                                    const updated = [...data.caseStudies];
                                                    updated[index] = { ...updated[index], brief: text };
                                                    updateData({ caseStudies: updated });
                                                }}
                                                fieldType="brief"
                                                context={`Brand: ${cs.brandName}, Industry: ${cs.industry}`}
                                                disabled={!hasExistingApiKey}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Result</Label>
                                            <Input
                                                placeholder="e.g. 450K views, 8.2% engagement"
                                                value={cs.result}
                                                onChange={(e) => {
                                                    const updated = [...data.caseStudies];
                                                    updated[index] = { ...updated[index], result: e.target.value };
                                                    updateData({ caseStudies: updated });
                                                }}
                                            />
                                            <ImproveWithAI
                                                value={cs.result}
                                                onImproved={(text) => {
                                                    const updated = [...data.caseStudies];
                                                    updated[index] = { ...updated[index], result: text };
                                                    updateData({ caseStudies: updated });
                                                }}
                                                fieldType="result"
                                                context={`Brand: ${cs.brandName}, Industry: ${cs.industry}, Brief: ${cs.brief}`}
                                                disabled={!hasExistingApiKey}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs flex items-center gap-1.5">
                                                <ExternalLink className="h-3 w-3" />
                                                Content Link <span className="text-muted-foreground font-normal">(optional)</span>
                                            </Label>
                                            <Input
                                                type="url"
                                                placeholder="https://youtube.com/watch?v=... or Instagram post URL"
                                                value={cs.contentUrl}
                                                onChange={(e) => {
                                                    const updated = [...data.caseStudies];
                                                    updated[index] = { ...updated[index], contentUrl: e.target.value };
                                                    updateData({ caseStudies: updated });
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground">Link to your YouTube video, Instagram post, TikTok, or blog — brands will be able to see it directly.</p>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addCaseStudy} className="w-full gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Showcase / Case Study
                                </Button>

                                <Separator />

                                {/* Brands worked with — quick tag list */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium">Brands you&apos;ve worked with</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">A quick list of brand names — the AI uses this to show credibility in pitches.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {data.previousBrands.map((brand) => (
                                            <Badge key={brand} variant="secondary" className="gap-1.5 pl-3 pr-1.5 py-1.5">
                                                {brand}
                                                <button onClick={() => removeBrand(brand)} className="hover:bg-foreground/10 rounded p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="e.g. Land Rover, BMW, Disney..."
                                            value={newBrand}
                                            onChange={(e) => setNewBrand(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBrand(); } }}
                                            className="max-w-xs"
                                        />
                                        <Button variant="outline" size="sm" onClick={addBrand}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 7: Testimonials */}
                    {currentStep === 6 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-pink-400 via-rose-400 to-brand" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">💬</div>
                                <CardTitle className="font-heading text-2xl">
                                    What do brands say about you?
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Client testimonials boost credibility in pitches and proposals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.testimonials.map((t, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                                        <button
                                            onClick={() => removeTestimonial(index)}
                                            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Quote</Label>
                                            <Textarea
                                                rows={2}
                                                placeholder="What did they say?"
                                                value={t.quote}
                                                onChange={(e) => {
                                                    const updated = [...data.testimonials];
                                                    updated[index] = { ...updated[index], quote: e.target.value };
                                                    updateData({ testimonials: updated });
                                                }}
                                                className="resize-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Name</Label>
                                                <Input
                                                    placeholder="Jane Smith"
                                                    value={t.authorName}
                                                    onChange={(e) => {
                                                        const updated = [...data.testimonials];
                                                        updated[index] = { ...updated[index], authorName: e.target.value };
                                                        updateData({ testimonials: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Title</Label>
                                                <Input
                                                    placeholder="Account Director"
                                                    value={t.authorTitle}
                                                    onChange={(e) => {
                                                        const updated = [...data.testimonials];
                                                        updated[index] = { ...updated[index], authorTitle: e.target.value };
                                                        updateData({ testimonials: updated });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Company</Label>
                                                <Input
                                                    placeholder="Brand Inc."
                                                    value={t.company}
                                                    onChange={(e) => {
                                                        const updated = [...data.testimonials];
                                                        updated[index] = { ...updated[index], company: e.target.value };
                                                        updateData({ testimonials: updated });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addTestimonial} className="w-full gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Testimonial
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 8: Business Details */}
                    {currentStep === 7 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-slate-400 via-brand to-emerald-400" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">🏦</div>
                                <CardTitle className="font-heading text-2xl">
                                    Business details for invoicing
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Used to auto-populate your invoices and contracts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="businessName">Business Name</Label>
                                        <Input
                                            id="businessName"
                                            placeholder="e.g. Digital Farm Ltd"
                                            value={data.businessName}
                                            onChange={(e) => updateData({ businessName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vatNumber">VAT Number</Label>
                                        <Input
                                            id="vatNumber"
                                            placeholder="e.g. GB123456789"
                                            value={data.vatNumber}
                                            onChange={(e) => updateData({ vatNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessAddress">Business Address</Label>
                                    <Textarea
                                        id="businessAddress"
                                        rows={3}
                                        placeholder="Full business address..."
                                        value={data.businessAddress}
                                        onChange={(e) => updateData({ businessAddress: e.target.value })}
                                        className="resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankDetails">Bank Details</Label>
                                    <Textarea
                                        id="bankDetails"
                                        rows={3}
                                        placeholder="Account name, sort code, account number..."
                                        value={data.bankDetails}
                                        onChange={(e) => updateData({ bankDetails: e.target.value })}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Stored securely. Used to auto-populate invoices.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentTerms">Default Payment Terms</Label>
                                        <select
                                            id="paymentTerms"
                                            value={data.paymentTerms}
                                            onChange={(e) => updateData({ paymentTerms: e.target.value })}
                                            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                        >
                                            <option value="net-7">Net 7</option>
                                            <option value="net-14">Net 14</option>
                                            <option value="net-30">Net 30</option>
                                            <option value="net-60">Net 60</option>
                                            <option value="on-receipt">On Receipt</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <select
                                            id="currency"
                                            value={data.currency}
                                            onChange={(e) => updateData({ currency: e.target.value })}
                                            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                        >
                                            <option value="GBP">GBP (£)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 9: Rate Card */}
                    {currentStep === 8 && (() => {
                        const currencySymbol = data.currency === "GBP" ? "£" : data.currency === "EUR" ? "€" : "$";
                        const rateTypes = [
                            { id: "yt_integration", label: "YouTube Integration", emoji: "🎬", desc: "Sponsored segment within your video" },
                            { id: "yt_dedicated", label: "YouTube Dedicated", emoji: "📹", desc: "Entire video about the brand" },
                            { id: "ig_reel", label: "Instagram Reel", emoji: "📱", desc: "Short-form sponsored reel" },
                            { id: "ig_story", label: "Instagram Story Set", emoji: "📖", desc: "Series of story slides" },
                            { id: "tt_video", label: "TikTok Video", emoji: "🎵", desc: "Sponsored TikTok post" },
                            { id: "bundle", label: "Multi-Platform Bundle", emoji: "📦", desc: "Combined package deal" },
                        ];

                        // Build the rate card string from explicit rate inputs
                        const buildRateCard = (rateId: string, field: "min" | "max", value: string) => {
                            // Parse existing structured rates from data.rateCard by exact label match
                            const existingRates: Record<string, { min: string; max: string }> = {};
                            const lines = data.rateCard.split("\n").filter(Boolean);
                            const extraLines: string[] = [];

                            for (const line of lines) {
                                let matched = false;
                                for (const rt of rateTypes) {
                                    if (line.startsWith(rt.label + ":") || line.startsWith(rt.label + " :")) {
                                        const nums = line.match(/[\d,]+/g);
                                        if (nums) {
                                            existingRates[rt.id] = {
                                                min: nums[0]?.replace(/,/g, "") || "",
                                                max: nums[1]?.replace(/,/g, "") || nums[0]?.replace(/,/g, "") || "",
                                            };
                                        }
                                        matched = true;
                                        break;
                                    }
                                }
                                if (!matched) {
                                    extraLines.push(line);
                                }
                            }

                            // Apply the new value
                            if (!existingRates[rateId]) existingRates[rateId] = { min: "", max: "" };
                            existingRates[rateId][field] = value;

                            // Rebuild rate card string
                            const newLines: string[] = [];
                            for (const rt of rateTypes) {
                                const r = existingRates[rt.id];
                                if (r && (r.min || r.max)) {
                                    if (r.min && r.max && r.min !== r.max) {
                                        newLines.push(`${rt.label}: ${currencySymbol}${Number(r.min).toLocaleString()}-${currencySymbol}${Number(r.max).toLocaleString()}`);
                                    } else {
                                        const val = r.min || r.max;
                                        newLines.push(`${rt.label}: ${currencySymbol}${Number(val).toLocaleString()}`);
                                    }
                                }
                            }
                            // Preserve extra lines (usage rights, exclusivity, notes, etc.)
                            newLines.push(...extraLines);
                            updateData({ rateCard: newLines.join("\n") });
                        };

                        // Parse current rates by exact label match for display
                        const getCurrentRates = (): Record<string, { min: string; max: string }> => {
                            const rates: Record<string, { min: string; max: string }> = {};
                            const lines = data.rateCard.split("\n").filter(Boolean);
                            for (const line of lines) {
                                for (const rt of rateTypes) {
                                    if (line.startsWith(rt.label + ":") || line.startsWith(rt.label + " :")) {
                                        const nums = line.match(/[\d,]+/g);
                                        if (nums) {
                                            rates[rt.id] = {
                                                min: nums[0]?.replace(/,/g, "") || "",
                                                max: nums[1]?.replace(/,/g, "") || nums[0]?.replace(/,/g, "") || "",
                                            };
                                        }
                                        break;
                                    }
                                }
                            }
                            return rates;
                        };

                        const currentRates = getCurrentRates();

                        return (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-heading text-2xl">
                                        What do you charge?
                                    </CardTitle>
                                    <CardDescription>
                                        Set your pricing per content type. The AI uses this to suggest rates in pitches and contracts.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Content Type Rates */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {rateTypes.map((rt) => (
                                            <div
                                                key={rt.id}
                                                className="border rounded-xl p-4 space-y-3 hover:border-brand/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{rt.emoji}</span>
                                                    <div>
                                                        <p className="text-sm font-medium">{rt.label}</p>
                                                        <p className="text-[11px] text-muted-foreground">{rt.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="Min"
                                                            className="pl-6 h-8 text-sm"
                                                            value={currentRates[rt.id]?.min || ""}
                                                            onChange={(e) => buildRateCard(rt.id, "min", e.target.value)}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">to</span>
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="Max"
                                                            className="pl-6 h-8 text-sm"
                                                            value={currentRates[rt.id]?.max || ""}
                                                            onChange={(e) => buildRateCard(rt.id, "max", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add-ons */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">Add-ons & Extras</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="border rounded-xl p-4 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">📋</span>
                                                    <p className="text-sm font-medium">Usage Rights</p>
                                                </div>
                                                <Input
                                                    placeholder="e.g. +25-50%"
                                                    className="h-8 text-sm"
                                                    defaultValue={
                                                        data.rateCard.split("\n").find(l => l.toLowerCase().startsWith("usage"))?.split(":")[1]?.trim() || ""
                                                    }
                                                    onBlur={(e) => {
                                                        const lines = data.rateCard.split("\n").filter(l => !l.toLowerCase().startsWith("usage"));
                                                        if (e.target.value) lines.push(`Usage Rights: ${e.target.value}`);
                                                        updateData({ rateCard: lines.join("\n") });
                                                    }}
                                                />
                                            </div>
                                            <div className="border rounded-xl p-4 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">🔒</span>
                                                    <p className="text-sm font-medium">Exclusivity</p>
                                                </div>
                                                <Input
                                                    placeholder="e.g. +30-100%"
                                                    className="h-8 text-sm"
                                                    defaultValue={
                                                        data.rateCard.split("\n").find(l => l.toLowerCase().startsWith("exclusiv"))?.split(":")[1]?.trim() || ""
                                                    }
                                                    onBlur={(e) => {
                                                        const lines = data.rateCard.split("\n").filter(l => !l.toLowerCase().startsWith("exclusiv"));
                                                        if (e.target.value) lines.push(`Exclusivity: ${e.target.value}`);
                                                        updateData({ rateCard: lines.join("\n") });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional notes */}
                                    <div className="space-y-2">
                                        <Label htmlFor="rateNotes" className="text-sm">Additional Notes</Label>
                                        <Textarea
                                            id="rateNotes"
                                            rows={3}
                                            placeholder="Any other pricing info, minimum budgets, or custom packages..."
                                            className="resize-none text-sm"
                                            defaultValue={
                                                data.rateCard.split("\n").filter(l =>
                                                    l.toLowerCase().includes("note") || l.toLowerCase().includes("minimum")
                                                ).join("\n") || ""
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}



                    {/* Step 10: Email Setup */}
                    {currentStep === 9 && (
                        <Card className="overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-sky-400 via-blue-400 to-brand" />
                            <CardHeader className="text-center pb-2">
                                <div className="text-5xl mb-3">📧</div>
                                <CardTitle className="font-heading text-2xl">
                                    Email setup
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Configure how your outreach emails appear. You can connect email later in Settings.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="emailFromName" className="text-sm font-medium">From Name</Label>
                                    <Input
                                        id="emailFromName"
                                        placeholder="e.g. Stef from The Michalaks"
                                        value={data.emailFromName}
                                        onChange={(e) => updateData({ emailFromName: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">This is how your name appears in the recipient&apos;s inbox.</p>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="emailSignature" className="text-sm font-medium">Email Signature</Label>
                                    <Textarea
                                        id="emailSignature"
                                        rows={4}
                                        placeholder={"Best,\nStef Michalak\nThe Michalaks | @themichalaks\nwww.themichalaks.com"}
                                        value={data.emailSignature}
                                        onChange={(e) => updateData({ emailSignature: e.target.value })}
                                        className="resize-none font-mono text-sm"
                                    />
                                    <ImproveWithAI
                                        value={data.emailSignature}
                                        onImproved={(text) => updateData({ emailSignature: text })}
                                        fieldType="emailSignature"
                                        disabled={!hasExistingApiKey}
                                    />
                                </div>
                                <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                                    <p className="text-sm text-muted-foreground">
                                        Your AI will append this signature automatically to every outreach email it drafts.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 11: Done */}
                    {currentStep === 10 && (
                        <Card className="text-center overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-brand via-emerald-400 to-amber-400" />
                            <CardContent className="pt-12 pb-8">
                                <div className="flex justify-center mb-6">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white text-3xl font-heading font-bold">
                                        {progress}%
                                    </div>
                                </div>
                                <h2 className="text-2xl font-heading font-semibold mb-2">
                                    🎉 You&apos;re all set!
                                </h2>
                                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                                    Your AI agent is ready to go. The more complete your profile is, the better
                                    your AI-generated pitches and contracts will be.
                                </p>
                                <p className="text-sm font-medium text-brand mb-2">
                                    {completedCount} of {totalSteps} steps completed · {progress}%
                                </p>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                                    You can always update everything in <strong>Settings</strong>.
                                </p>
                                <Button
                                    className="bg-brand hover:bg-brand/90 text-white gap-2 h-12 px-8 text-base"
                                    disabled={saving}
                                    onClick={async () => {
                                        setSaving(true);
                                        try {
                                            // Save the done step to mark onboarding complete
                                            await fetch("/api/onboarding", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ step: "done", data }),
                                            });
                                        } catch { /* proceed anyway */ }
                                        setSaving(false);
                                        router.push("/dashboard");
                                    }}
                                >
                                    {saving ? "Saving..." : "Save & Go to Dashboard"}
                                    {!saving && <ArrowRight className="h-5 w-5" />}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Navigation Buttons */}
                    {currentStep < 10 && (
                        <div className="flex items-center justify-between mt-6">
                            <Button
                                variant="ghost"
                                onClick={goBack}
                                disabled={currentStep === 0}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" onClick={skip} className="gap-2 text-muted-foreground">
                                    <SkipForward className="h-4 w-4" />
                                    Skip
                                </Button>
                                <Button
                                    onClick={saveAndContinue}
                                    disabled={saving}
                                    className="bg-brand hover:bg-brand/90 text-white gap-2"
                                >
                                    {saving ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="h-4 w-4" /> Save & Continue</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
