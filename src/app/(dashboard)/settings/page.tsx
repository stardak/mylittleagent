"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-context";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import {
    User,
    Palette,
    Bot,
    Users,
    Save,
    Plus,
    Loader2,
    ShieldCheck,
    ExternalLink as ExternalLinkIcon,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    ClipboardEdit,
    Mail,
    Unlink,
    RefreshCw,
} from "lucide-react";

import { Suspense } from "react";

function SettingsContent() {
    const { workspaceName } = useWorkspace();
    const searchParams = useSearchParams();
    const router = useRouter();
    const validTabs = ["profile", "appearance", "ai", "team", "integrations"];
    const tabFromUrl = searchParams.get("tab");
    const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "profile";
    const [activeTab, setActiveTab] = useState(initialTab);

    // Keep tab in sync with URL
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        router.replace(`/settings?tab=${value}`, { scroll: false });
    };

    // Gmail connection state
    const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email: string | null } | null>(null);
    const [gmailLoading, setGmailLoading] = useState(false);
    const [gmailConnecting, setGmailConnecting] = useState(false);

    const fetchGmailStatus = useCallback(async () => {
        setGmailLoading(true);
        try {
            const res = await fetch("/api/gmail/status");
            if (res.ok) setGmailStatus(await res.json());
        } finally { setGmailLoading(false); }
    }, []);

    const handleConnectGmail = async () => {
        setGmailConnecting(true);
        try {
            const res = await fetch("/api/gmail/connect");
            const { url } = await res.json();
            window.location.href = url;
        } catch {
            toast.error("Failed to start Gmail connection");
            setGmailConnecting(false);
        }
    };

    const handleDisconnectGmail = async () => {
        await fetch("/api/gmail/status", { method: "DELETE" });
        setGmailStatus({ connected: false, email: null });
        toast.success("Gmail disconnected");
    };

    useEffect(() => {
        if (activeTab === "integrations") fetchGmailStatus();
        // Check for OAuth callback result
        const gmailParam = searchParams.get("gmail");
        if (gmailParam === "connected") {
            toast.success("Gmail connected!", { description: "You can now send outreach emails directly from the app." });
            setActiveTab("integrations");
            fetchGmailStatus();
        } else if (gmailParam === "error") {
            toast.error("Gmail connection failed", { description: "Please try again or check your GCP settings." });
            setActiveTab("integrations");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    return (
        <div className="p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-semibold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account, appearance, AI preferences, and integrations.
                </p>
            </div>

            {/* Onboarding Re-entry Banner */}
            <Link href="/onboarding">
                <div className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-brand/20 bg-brand/5 px-5 py-4 transition-colors hover:bg-brand/10 cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                            <ClipboardEdit className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Edit your Setup Wizard</p>
                            <p className="text-xs text-muted-foreground">
                                Brand profile, platforms, audience, case studies, business details, rate card, and email setup
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-brand shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
            </Link>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-muted/50 h-11">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2">
                        <Bot className="h-4 w-4" />
                        AI
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-2">
                        <Users className="h-4 w-4" />
                        Team
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Integrations
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Your Profile</CardTitle>
                            <CardDescription>
                                Personal details for your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="userName">Full Name</Label>
                                    <Input id="userName" placeholder="Stef Michalak" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="userEmail">Email</Label>
                                    <Input
                                        id="userEmail"
                                        type="email"
                                        placeholder="stefan@digital-farm.co.uk"
                                    />
                                </div>
                            </div>
                            <Button className="bg-brand hover:bg-brand/90 text-white gap-2" onClick={() => toast.success("Profile saved", { description: "Your profile changes have been saved." })}>
                                <Save className="h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Brand Visuals</CardTitle>
                            <CardDescription>
                                Customise how your brand appears in invoices and reports.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="primaryColor">Primary Color</Label>
                                    <div className="flex gap-3 items-center">
                                        <Input
                                            id="primaryColor"
                                            defaultValue="#ea3382"
                                            className="max-w-32"
                                        />
                                        <div
                                            className="h-9 w-9 rounded-lg border"
                                            style={{ backgroundColor: "#ea3382" }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="headingFont">Heading Font</Label>
                                    <Input
                                        id="headingFont"
                                        defaultValue="Recoleta"
                                        className="max-w-48"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Logo</Label>
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Drag and drop your logo here, or click to upload
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.info("Coming Soon", { description: "Logo upload will be available in a future update." })}>
                                        Upload Logo
                                    </Button>
                                </div>
                            </div>
                            <Button className="bg-brand hover:bg-brand/90 text-white gap-2" onClick={() => toast.success("Appearance saved", { description: "Your brand visuals have been saved." })}>
                                <Save className="h-4 w-4" />
                                Save Appearance
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Settings Tab */}
                <TabsContent value="ai">
                    <AiSettingsTab />
                </TabsContent>

                {/* Team Tab */}
                <TabsContent value="team">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="font-heading">Team Members</CardTitle>
                                    <CardDescription>
                                        Manage who has access to {workspaceName ?? "your workspace"}.
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => toast.info("Coming Soon", { description: "Team collaboration features are on the roadmap." })}
                                >
                                    <Plus className="h-4 w-4" />
                                    Invite Member
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Users className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    No team members yet. Invite your first team member.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading flex items-center gap-2">
                                <Mail className="h-5 w-5 text-brand" />
                                Gmail
                            </CardTitle>
                            <CardDescription>
                                Connect your Gmail account to send outreach emails directly from the app and monitor replies.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {gmailLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Checking connection...
                                </div>
                            ) : gmailStatus?.connected ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-green-800">Gmail Connected</p>
                                            <p className="text-xs text-green-700 mt-0.5">{gmailStatus.email}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchGmailStatus} className="gap-1.5">
                                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDisconnectGmail}
                                        className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-2"
                                    >
                                        <Unlink className="h-4 w-4" />
                                        Disconnect Gmail
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border">
                                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Not connected</p>
                                            <p className="text-xs text-muted-foreground">Connect to send outreach emails without leaving the app</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleConnectGmail}
                                        disabled={gmailConnecting}
                                        className="bg-brand hover:bg-brand/90 text-white gap-2"
                                    >
                                        {gmailConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                        Connect Gmail
                                    </Button>
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">One-time GCP Setup Required</p>
                                <div className="text-sm text-muted-foreground space-y-1.5 bg-muted/30 rounded-lg p-4 border">
                                    <p>Before connecting Gmail, complete these steps in <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-brand underline">Google Cloud Console</a>:</p>
                                    <ol className="list-decimal list-inside space-y-1.5 mt-2">
                                        <li>Enable the <strong>Gmail API</strong> for your project (<code className="text-xs bg-muted px-1 rounded">476133354291</code>)</li>
                                        <li>OAuth consent screen → Scopes → add <code className="text-xs bg-muted px-1 rounded">gmail.send</code> and <code className="text-xs bg-muted px-1 rounded">gmail.readonly</code></li>
                                        <li>Test users → add your email address</li>
                                        <li>Credentials → OAuth 2.0 Client → add Authorised redirect URI:<br />
                                            <code className="text-xs bg-muted px-1 rounded">https://mylittleagent.vercel.app/api/gmail/callback</code></li>
                                    </ol>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}

function AiSettingsTab() {
    const [hasKey, setHasKey] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState("");
    const [testing, setTesting] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle");
    const [error, setError] = useState("");

    const checkKeyStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/settings/api-key");
            if (res.ok) {
                const data = await res.json();
                setHasKey(data.hasKey);
                setLastUpdated(data.lastUpdated);
            }
        } catch {
            console.error("Failed to check API key status");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { checkKeyStatus(); }, [checkKeyStatus]);

    const saveKey = async () => {
        if (!newKey) return;
        setTesting(true);
        setError("");
        try {
            const res = await fetch("/api/settings/api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: newKey }),
            });
            if (res.ok) {
                setStatus("valid");
                setNewKey("");
                checkKeyStatus();
            } else {
                const err = await res.json();
                setStatus("invalid");
                setError(err.error || "Invalid API key");
            }
        } catch {
            setStatus("invalid");
            setError("Network error");
        } finally {
            setTesting(false);
        }
    };

    const removeKey = async () => {
        setRemoving(true);
        try {
            await fetch("/api/settings/api-key", { method: "DELETE" });
            setHasKey(false);
            setLastUpdated(null);
            setStatus("idle");
        } catch {
            console.error("Failed to remove key");
        } finally {
            setRemoving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading">AI Manager — API Key</CardTitle>
                    <CardDescription>
                        Your AI features are powered by your own Anthropic API key (BYOK). We encrypt it and never see it in plain text.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {hasKey ? (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-green-900">API key configured</p>
                                    {lastUpdated && (
                                        <p className="text-xs text-green-700">
                                            Last updated: {new Date(lastUpdated).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setHasKey(false); setStatus("idle"); }}>
                                    Update Key
                                </Button>
                                <Button variant="destructive" size="sm" onClick={removeKey} disabled={removing}>
                                    {removing ? "Removing..." : "Remove"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <p className="text-sm font-medium">How to get your API key:</p>
                                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                                    <li>Create a free account at{" "}
                                        <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                                            className="text-brand hover:underline inline-flex items-center gap-1">
                                            console.anthropic.com <ExternalLinkIcon className="h-3 w-3" />
                                        </a>
                                    </li>
                                    <li>Add billing (pay-as-you-go)</li>
                                    <li>Create an API key and paste it below</li>
                                </ol>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="settingsApiKey">Anthropic API Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="settingsApiKey"
                                        type="password"
                                        placeholder="sk-ant-..."
                                        value={newKey}
                                        onChange={(e) => { setNewKey(e.target.value); setStatus("idle"); setError(""); }}
                                        className={status === "valid" ? "border-green-500" : status === "invalid" ? "border-red-500" : ""}
                                    />
                                    <Button
                                        onClick={saveKey}
                                        disabled={!newKey || testing}
                                        className="bg-brand hover:bg-brand/90 text-white shrink-0 gap-2"
                                    >
                                        {testing ? <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</> : "Save & Test"}
                                    </Button>
                                </div>
                                {status === "valid" && (
                                    <p className="text-sm text-green-600 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4" /> Key verified and saved!
                                    </p>
                                )}
                                {status === "invalid" && error && (
                                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                                        <AlertCircle className="h-4 w-4" /> {error}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex items-start gap-3 bg-brand/5 border border-brand/20 rounded-lg p-4">
                        <ShieldCheck className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-brand">Typical cost: £3-10/month</p>
                            <p className="text-muted-foreground mt-1">
                                Pitch email ~£0.01 · Contract ~£0.03 · AI manager chat ~£0.02-0.05.
                                Billed directly by Anthropic to your account.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-heading">AI Preferences</CardTitle>
                    <CardDescription>Configure what context gets included in AI-generated content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: "Auto-include case studies", desc: "Include relevant case studies in AI-generated pitches" },
                        { label: "Auto-include testimonials", desc: "Reference client testimonials in outreach emails" },
                        { label: "Include platform stats", desc: "Add follower counts and engagement rates to pitches" },
                    ].map((pref) => (
                        <div key={pref.label} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{pref.label}</p>
                                <p className="text-xs text-muted-foreground">{pref.desc}</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
