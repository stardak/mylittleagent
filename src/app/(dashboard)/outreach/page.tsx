"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ImproveWithAI } from "@/components/ui/improve-with-ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Plus,
    Search,
    Send,
    Mail,
    FileText,
    Sparkles,
    Archive,
    ArchiveRestore,
    Trash2,
    ChevronRight,
    Clock,
    CheckCircle2,
    Circle,
    Edit3,
    Save,
    X,
    Loader2,
    MessageSquareReply,
    ArrowRight,
    Copy,
} from "lucide-react";

// Types
type Outreach = {
    id: string;
    brandName: string;
    contactEmail: string;
    product: string;
    fitReason: string | null;
    brandIndustry: string | null;
    brandUrl: string | null;
    email1Subject: string | null;
    email1Body: string | null;
    email1SentAt: string | null;
    email2Subject: string | null;
    email2Body: string | null;
    email2SentAt: string | null;
    email2DueAt: string | null;
    proposal: ProposalData | null;
    proposalSentAt: string | null;
    status: string;
    repliedAt: string | null;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
    brand?: { id: string; name: string; industry: string | null } | null;
};

type ProposalData = {
    title: string;
    summary: string;
    collaborationConcept: string;
    deliverables: { type: string; description: string; platform: string }[];
    audienceStats: string;
    pastWork: { brand: string; description: string }[];
    timeline: { phase: string; milestone: string }[];
    nextSteps: string;
};

const OUTREACH_STATUSES = [
    { id: "all", label: "All", color: "bg-slate-100 text-slate-700" },
    { id: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
    { id: "sent", label: "Sent", color: "bg-blue-100 text-blue-700" },
    { id: "followed_up", label: "Followed Up", color: "bg-amber-100 text-amber-700" },
    { id: "replied", label: "Replied", color: "bg-cyan-100 text-cyan-700" },
    { id: "proposal_sent", label: "Proposal Sent", color: "bg-emerald-100 text-emerald-700" },
    { id: "archived", label: "Archived", color: "bg-neutral-100 text-neutral-500" },
];

const statusColor = (status: string) =>
    OUTREACH_STATUSES.find((s) => s.id === status)?.color || "bg-slate-100 text-slate-700";

const statusLabel = (status: string) =>
    OUTREACH_STATUSES.find((s) => s.id === status)?.label || status;

const INDUSTRIES = [
    "Automotive", "Beauty & Cosmetics", "Fashion", "FinTech", "Food & Beverage",
    "Health & Wellness", "Home & Garden", "Retail", "Sports & Fitness",
    "Technology", "Toys & Games", "Travel & Hospitality", "Other",
];

export default function OutreachPage() {
    const [outreaches, setOutreaches] = useState<Outreach[]>([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [showNewOutreach, setShowNewOutreach] = useState(false);
    const [selected, setSelected] = useState<Outreach | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // New outreach form
    const [newOutreach, setNewOutreach] = useState({
        brandName: "",
        contactEmail: "",
        product: "",
        fitReason: "",
        brandIndustry: "",
        brandUrl: "",
        includeMediaCard: false,
    });

    // Workspace slug for media card link
    const [workspaceSlug, setWorkspaceSlug] = useState<string>("");

    // AI generation states
    const [generatingEmails, setGeneratingEmails] = useState(false);
    const [generatingProposal, setGeneratingProposal] = useState(false);

    // Edit states
    const [editingEmail1, setEditingEmail1] = useState(false);
    const [editingEmail2, setEditingEmail2] = useState(false);
    const [editEmail1, setEditEmail1] = useState({ subject: "", body: "" });
    const [editEmail2, setEditEmail2] = useState({ subject: "", body: "" });

    const fetchOutreaches = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (filterStatus !== "all") params.set("status", filterStatus);
            const res = await fetch(`/api/outreach?${params}`);
            if (res.ok) {
                const data = await res.json();
                setOutreaches(data);
            }
        } catch (error) {
            console.error("Failed to fetch outreach:", error);
        } finally {
            setLoading(false);
        }
    }, [search, filterStatus]);

    useEffect(() => {
        fetchOutreaches();
        // Fetch workspace slug for media card link
        fetch("/api/media-card")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => { if (d?.slug) setWorkspaceSlug(d.slug); })
            .catch(() => { });
    }, [fetchOutreaches]);

    const createOutreach = async () => {
        if (!newOutreach.brandName.trim() || !newOutreach.contactEmail.trim() || !newOutreach.product.trim()) return;
        setCreateError(null);
        setSaving(true);
        try {
            const res = await fetch("/api/outreach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOutreach),
            });
            if (res.ok) {
                setShowNewOutreach(false);
                setNewOutreach({ brandName: "", contactEmail: "", product: "", fitReason: "", brandIndustry: "", brandUrl: "", includeMediaCard: false });
                fetchOutreaches();
                toast.success("Outreach created", { description: "Your brand brief has been saved. Generate emails next!" });
            } else {
                const data = await res.json().catch(() => ({}));
                setCreateError(data.error || "Failed to create outreach");
            }
        } catch {
            setCreateError("Network error — couldn't reach the server.");
        } finally {
            setSaving(false);
        }
    };

    const openDetail = async (outreach: Outreach) => {
        try {
            const res = await fetch(`/api/outreach/${outreach.id}`);
            if (res.ok) {
                const full = await res.json();
                setSelected(full);
                setShowDetail(true);
                setEditingEmail1(false);
                setEditingEmail2(false);
            }
        } catch (error) {
            console.error("Failed to fetch outreach:", error);
        }
    };

    const generateEmails = async () => {
        if (!selected) return;
        setGeneratingEmails(true);
        try {
            const res = await fetch(`/api/outreach/${selected.id}/generate-emails`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setSelected({
                    ...selected,
                    email1Subject: data.email1.subject,
                    email1Body: data.email1.body,
                    email2Subject: data.email2.subject,
                    email2Body: data.email2.body,
                });
                toast.success("Emails generated!", { description: "Review and edit before sending." });
            } else {
                toast.error("Generation failed", { description: data.error });
            }
        } catch {
            toast.error("Failed to generate emails");
        } finally {
            setGeneratingEmails(false);
        }
    };

    const generateProposal = async () => {
        if (!selected) return;
        setGeneratingProposal(true);
        try {
            const res = await fetch(`/api/outreach/${selected.id}/generate-proposal`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setSelected({ ...selected, proposal: data.proposal });
                toast.success("Proposal generated!", { description: "Review and edit before sending." });
            } else {
                toast.error("Generation failed", { description: data.error });
            }
        } catch {
            toast.error("Failed to generate proposal");
        } finally {
            setGeneratingProposal(false);
        }
    };

    const updateOutreach = async (id: string, updates: Record<string, unknown>) => {
        try {
            const res = await fetch(`/api/outreach/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const updated = await res.json();
                setSelected(updated);
                setOutreaches((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
                return true;
            }
        } catch (error) {
            console.error("Failed to update:", error);
        }
        return false;
    };

    const markEmail1Sent = async () => {
        if (!selected) return;
        const ok = await updateOutreach(selected.id, { markEmail1Sent: true });
        if (ok) toast.success("Email 1 marked as sent", { description: "Follow-up scheduled in 7 days." });
    };

    const markEmail2Sent = async () => {
        if (!selected) return;
        const ok = await updateOutreach(selected.id, { markEmail2Sent: true });
        if (ok) toast.success("Follow-up marked as sent", { description: "If no reply, outreach will be archived." });
    };

    const markReplied = async () => {
        if (!selected) return;
        const ok = await updateOutreach(selected.id, { markReplied: true });
        if (ok) toast.success("Marked as replied!", { description: "You can now generate a pitch proposal." });
    };

    const markProposalSent = async () => {
        if (!selected) return;
        const ok = await updateOutreach(selected.id, { markProposalSent: true });
        if (ok) toast.success("Proposal marked as sent!");
    };

    const archiveOutreach = async () => {
        if (!selected) return;
        const ok = await updateOutreach(selected.id, { status: "archived" });
        if (ok) toast.success("Outreach archived");
    };

    const unarchiveOutreach = async () => {
        if (!selected) return;
        // Restore to the appropriate prior status
        let restoreStatus = "draft";
        if (selected.proposalSentAt) restoreStatus = "proposal_sent";
        else if (selected.repliedAt) restoreStatus = "replied";
        else if (selected.email2SentAt) restoreStatus = "followed_up";
        else if (selected.email1SentAt) restoreStatus = "sent";
        const ok = await updateOutreach(selected.id, { status: restoreStatus });
        if (ok) toast.success("Outreach restored", { description: `Status set to ${statusLabel(restoreStatus)}` });
    };

    const deleteOutreach = async (id: string) => {
        try {
            const res = await fetch(`/api/outreach/${id}`, { method: "DELETE" });
            if (res.ok) {
                setOutreaches((prev) => prev.filter((o) => o.id !== id));
                setShowDetail(false);
                setSelected(null);
                toast.success("Outreach deleted");
            } else {
                toast.error("Failed to delete outreach");
            }
        } catch {
            toast.error("Failed to delete");
        }
    };

    const saveEmail1 = async () => {
        if (!selected) return;
        const ok = await updateOutreach(selected.id, {
            email1Subject: editEmail1.subject,
            email1Body: editEmail1.body,
        });
        if (ok) {
            setEditingEmail1(false);
            toast.success("Email 1 saved");
        }
    };

    const saveEmail2 = async () => {
        if (!selected) return;
        const ok = await updateOutreach(selected.id, {
            email2Subject: editEmail2.subject,
            email2Body: editEmail2.body,
        });
        if (ok) {
            setEditingEmail2(false);
            toast.success("Email 2 saved");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const getStatusCounts = () => {
        const counts: Record<string, number> = {};
        outreaches.forEach((o) => {
            counts[o.status] = (counts[o.status] || 0) + 1;
        });
        return counts;
    };

    const statusCounts = getStatusCounts();

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    // Pipeline stepper for the detail sheet
    const PIPELINE_STEPS = [
        { id: "draft", label: "Draft", icon: Circle },
        { id: "sent", label: "Sent", icon: Send },
        { id: "followed_up", label: "Followed Up", icon: Clock },
        { id: "replied", label: "Replied", icon: MessageSquareReply },
        { id: "proposal_sent", label: "Proposal Sent", icon: FileText },
    ];

    const getStepState = (stepId: string, currentStatus: string) => {
        const stepOrder = ["draft", "sent", "followed_up", "replied", "proposal_sent"];
        const currentIdx = stepOrder.indexOf(currentStatus === "archived" ? "proposal_sent" : currentStatus);
        const stepIdx = stepOrder.indexOf(stepId);
        if (stepIdx < currentIdx) return "completed";
        if (stepIdx === currentIdx) return "current";
        return "upcoming";
    };

    return (
        <div className="p-8 space-y-6 overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-heading font-semibold">Brand Outreach</h1>
                        <p className="text-muted-foreground mt-1">
                            {outreaches.length} outreach{outreaches.length !== 1 ? "es" : ""} · Pitch brands you want to work with
                        </p>
                    </div>
                    <Dialog open={showNewOutreach} onOpenChange={setShowNewOutreach}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                                <Plus className="h-4 w-4" />
                                New Outreach
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="font-heading text-xl">New Brand Outreach</DialogTitle>
                                <DialogDescription>
                                    Start by entering details about the brand you want to pitch. We&apos;ll use this to generate personalised outreach emails.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Brand Name *</Label>
                                        <Input
                                            placeholder="e.g. Nike"
                                            value={newOutreach.brandName}
                                            onChange={(e) => setNewOutreach({ ...newOutreach, brandName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Email *</Label>
                                        <Input
                                            type="email"
                                            placeholder="partnerships@brand.com"
                                            value={newOutreach.contactEmail}
                                            onChange={(e) => setNewOutreach({ ...newOutreach, contactEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Product / Service *</Label>
                                        <Input
                                            placeholder="e.g. Running shoes"
                                            value={newOutreach.product}
                                            onChange={(e) => setNewOutreach({ ...newOutreach, product: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Industry</Label>
                                        <select
                                            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                            value={newOutreach.brandIndustry}
                                            onChange={(e) => setNewOutreach({ ...newOutreach, brandIndustry: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {INDUSTRIES.map((ind) => (
                                                <option key={ind} value={ind}>{ind}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand Website <span className="text-muted-foreground font-normal">(optional — helps AI write better emails)</span></Label>
                                    <Input
                                        type="url"
                                        placeholder="https://www.brand.com"
                                        value={newOutreach.brandUrl}
                                        onChange={(e) => setNewOutreach({ ...newOutreach, brandUrl: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Why you&apos;re a great fit <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                    <Textarea
                                        rows={3}
                                        placeholder="e.g. I already use this product daily, my audience is 70% their target demographic..."
                                        value={newOutreach.fitReason}
                                        onChange={(e) => setNewOutreach({ ...newOutreach, fitReason: e.target.value })}
                                        className="resize-none"
                                    />
                                    <ImproveWithAI
                                        value={newOutreach.fitReason}
                                        onImproved={(text) => setNewOutreach({ ...newOutreach, fitReason: text })}
                                        fieldType="fitReason"
                                        context={`Brand: ${newOutreach.brandName}. Product: ${newOutreach.product}. Industry: ${newOutreach.brandIndustry || "N/A"}`}
                                    />
                                </div>
                                {workspaceSlug && (
                                    <label className="flex items-center gap-2.5 bg-brand/5 border border-brand/10 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-brand/10">
                                        <input
                                            type="checkbox"
                                            checked={newOutreach.includeMediaCard}
                                            onChange={(e) => setNewOutreach({ ...newOutreach, includeMediaCard: e.target.checked })}
                                            className="rounded border-brand/30 text-brand focus:ring-brand h-4 w-4"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">Include media card link in email</p>
                                            <p className="text-xs text-muted-foreground">Adds a link to your public media card so brands can see your stats</p>
                                        </div>
                                    </label>
                                )}
                                <div className="flex flex-col gap-3 pt-2">
                                    {createError && (
                                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{createError}</p>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={() => { setShowNewOutreach(false); setCreateError(null); }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-brand hover:bg-brand/90 text-white gap-2"
                                            onClick={createOutreach}
                                            disabled={!newOutreach.brandName.trim() || !newOutreach.contactEmail.trim() || !newOutreach.product.trim() || saving}
                                        >
                                            {saving ? "Saving..." : "Create Outreach"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search outreach..."
                            className="pl-10 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Pipeline Status Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                {OUTREACH_STATUSES.map((s) => {
                    const count = s.id === "all" ? outreaches.length : (statusCounts[s.id] || 0);
                    const isActive = filterStatus === s.id;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setFilterStatus(s.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                                ${isActive
                                    ? "bg-brand text-white shadow-sm"
                                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                }
                            `}
                        >
                            {s.label}
                            <span className={`
                                text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                                ${isActive ? "bg-white/20 text-white" : "bg-background text-muted-foreground"}
                            `}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Outreach List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : outreaches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                        <Send className="h-8 w-8 text-brand" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold">No outreach yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                        Start pitching brands you want to work with. Create your first outreach to get personalised emails and proposals.
                    </p>
                    <Button
                        className="bg-brand hover:bg-brand/90 text-white gap-2 mt-4"
                        onClick={() => setShowNewOutreach(true)}
                    >
                        <Plus className="h-4 w-4" />
                        New Outreach
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product / Service</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</th>
                                <th className="w-12 px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {outreaches.map((outreach) => (
                                <tr
                                    key={outreach.id}
                                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                                    onClick={() => openDetail(outreach)}
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-sm">{outreach.brandName}</p>
                                            {outreach.brandIndustry && (
                                                <p className="text-xs text-muted-foreground">{outreach.brandIndustry}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                                        {outreach.product}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className={`text-xs ${statusColor(outreach.status)}`}>
                                            {statusLabel(outreach.status)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {outreach.contactEmail}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {timeAgo(outreach.updatedAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Sheet */}
            <Sheet open={showDetail} onOpenChange={setShowDetail}>
                <SheetContent className="sm:max-w-2xl overflow-y-auto p-0">
                    {selected && (
                        <>
                            {/* Hero Header */}
                            <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-transparent px-6 pt-6 pb-5">
                                <SheetHeader className="space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="h-14 w-14 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
                                            <Send className="h-6 w-6 text-brand" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <SheetTitle className="font-heading text-xl truncate">
                                                {selected.brandName}
                                            </SheetTitle>
                                            <SheetDescription className="flex items-center gap-2 mt-1">
                                                <Badge className={`${statusColor(selected.status)} text-xs`}>
                                                    {statusLabel(selected.status)}
                                                </Badge>
                                                {selected.brandIndustry && (
                                                    <span className="text-xs text-muted-foreground">{selected.brandIndustry}</span>
                                                )}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                {/* Pipeline Stepper */}
                                <div className="flex items-center gap-1 mt-5 overflow-x-auto">
                                    {PIPELINE_STEPS.map((step, i) => {
                                        const state = getStepState(step.id, selected.status);
                                        return (
                                            <div key={step.id} className="flex items-center">
                                                <div className={`
                                                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap
                                                    ${state === "completed" ? "bg-brand/15 text-brand" : ""}
                                                    ${state === "current" ? "bg-brand text-white" : ""}
                                                    ${state === "upcoming" ? "bg-muted/60 text-muted-foreground" : ""}
                                                `}>
                                                    {state === "completed" ? (
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    ) : (
                                                        <step.icon className="h-3 w-3" />
                                                    )}
                                                    {step.label}
                                                </div>
                                                {i < PIPELINE_STEPS.length - 1 && (
                                                    <ArrowRight className={`h-3 w-3 mx-0.5 shrink-0 ${state === "completed" || state === "current" ? "text-brand/40" : "text-muted-foreground/30"}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="px-6 pb-6 space-y-5 mt-1">
                                {/* Brand Brief Summary */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brand Brief</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Contact Email</p>
                                                <p className="text-sm font-medium">{selected.contactEmail}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Product / Service</p>
                                                <p className="text-sm font-medium">{selected.product}</p>
                                            </div>
                                        </div>
                                        {selected.brandUrl && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-muted-foreground">Website</p>
                                                <a href={selected.brandUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand hover:underline">
                                                    {selected.brandUrl}
                                                </a>
                                            </div>
                                        )}
                                        {selected.fitReason && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-muted-foreground">Why you&apos;re a great fit</p>
                                                <p className="text-sm mt-0.5">{selected.fitReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Email 1 — Initial Outreach */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-blue-500" />
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Email 1 — Initial Outreach
                                            </h3>
                                        </div>
                                        {selected.email1SentAt && (
                                            <Badge className="bg-blue-50 text-blue-600 text-[10px]">
                                                Sent {formatDate(selected.email1SentAt)}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {!selected.email1Subject && !selected.email1Body ? (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-muted-foreground mb-3">Generate a personalised outreach email using AI</p>
                                                <Button
                                                    onClick={generateEmails}
                                                    disabled={generatingEmails}
                                                    className="bg-brand hover:bg-brand/90 text-white gap-2"
                                                >
                                                    {generatingEmails ? (
                                                        <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                                                    ) : (
                                                        <><Sparkles className="h-4 w-4" /> Generate Emails</>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : editingEmail1 ? (
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Subject</Label>
                                                    <Input
                                                        value={editEmail1.subject}
                                                        onChange={(e) => setEditEmail1({ ...editEmail1, subject: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Body</Label>
                                                    <Textarea
                                                        rows={8}
                                                        value={editEmail1.body}
                                                        onChange={(e) => setEditEmail1({ ...editEmail1, body: e.target.value })}
                                                        className="resize-none text-sm"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setEditingEmail1(false)}>
                                                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                                                    </Button>
                                                    <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={saveEmail1}>
                                                        <Save className="h-3.5 w-3.5 mr-1" /> Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Subject</p>
                                                    <p className="text-sm font-medium">{selected.email1Subject}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Body</p>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.email1Body}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditEmail1({ subject: selected.email1Subject || "", body: selected.email1Body || "" });
                                                            setEditingEmail1(true);
                                                        }}
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(`Subject: ${selected.email1Subject}\n\n${selected.email1Body}`)}
                                                    >
                                                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                                                    </Button>
                                                    {!selected.email1SentAt && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                                                            onClick={markEmail1Sent}
                                                        >
                                                            <Send className="h-3.5 w-3.5 mr-1" /> Mark as Sent
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Email 2 — Follow-Up */}
                                <div className={`border rounded-xl overflow-hidden ${!selected.email1SentAt ? "opacity-50 pointer-events-none" : ""}`}>
                                    <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Email 2 — Follow-Up (7 days)
                                            </h3>
                                        </div>
                                        {selected.email2SentAt ? (
                                            <Badge className="bg-amber-50 text-amber-600 text-[10px]">
                                                Sent {formatDate(selected.email2SentAt)}
                                            </Badge>
                                        ) : selected.email2DueAt ? (
                                            <Badge className="bg-amber-50 text-amber-600 text-[10px]">
                                                Due {formatDate(selected.email2DueAt)}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <div className="p-4">
                                        {!selected.email2Subject && !selected.email2Body ? (
                                            <p className="text-sm text-muted-foreground text-center py-2">
                                                Follow-up will be generated with Email 1
                                            </p>
                                        ) : editingEmail2 ? (
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Subject</Label>
                                                    <Input
                                                        value={editEmail2.subject}
                                                        onChange={(e) => setEditEmail2({ ...editEmail2, subject: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Body</Label>
                                                    <Textarea
                                                        rows={5}
                                                        value={editEmail2.body}
                                                        onChange={(e) => setEditEmail2({ ...editEmail2, body: e.target.value })}
                                                        className="resize-none text-sm"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setEditingEmail2(false)}>
                                                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                                                    </Button>
                                                    <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={saveEmail2}>
                                                        <Save className="h-3.5 w-3.5 mr-1" /> Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Subject</p>
                                                    <p className="text-sm font-medium">{selected.email2Subject}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Body</p>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.email2Body}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditEmail2({ subject: selected.email2Subject || "", body: selected.email2Body || "" });
                                                            setEditingEmail2(true);
                                                        }}
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(`Subject: ${selected.email2Subject}\n\n${selected.email2Body}`)}
                                                    >
                                                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                                                    </Button>
                                                    {!selected.email2SentAt && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-amber-600 hover:bg-amber-700 text-white ml-auto"
                                                            onClick={markEmail2Sent}
                                                        >
                                                            <Send className="h-3.5 w-3.5 mr-1" /> Mark as Sent
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reply Status */}
                                {(selected.status === "followed_up" || selected.status === "sent") && !selected.repliedAt && (
                                    <div className="border-2 border-dashed border-cyan-200 rounded-xl p-4 text-center bg-cyan-50/50">
                                        <MessageSquareReply className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                                        <p className="text-sm font-medium">Did the brand reply?</p>
                                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                                            Mark as replied to unlock the pitch proposal generator
                                        </p>
                                        <Button onClick={markReplied} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Mark as Replied
                                        </Button>
                                    </div>
                                )}

                                {/* Pitch Proposal */}
                                <div className={`border rounded-xl overflow-hidden ${!selected.repliedAt && selected.status !== "proposal_sent" ? "opacity-50 pointer-events-none" : ""}`}>
                                    <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-emerald-500" />
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Pitch Proposal
                                            </h3>
                                        </div>
                                        {selected.proposalSentAt && (
                                            <Badge className="bg-emerald-50 text-emerald-600 text-[10px]">
                                                Sent {formatDate(selected.proposalSentAt)}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {!selected.proposal ? (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    Generate a tailored pitch proposal to close the deal
                                                </p>
                                                <Button
                                                    onClick={generateProposal}
                                                    disabled={generatingProposal}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                                >
                                                    {generatingProposal ? (
                                                        <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                                                    ) : (
                                                        <><Sparkles className="h-4 w-4" /> Generate Proposal</>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Proposal Title & Summary */}
                                                <div>
                                                    <h4 className="font-heading font-semibold text-base">
                                                        {(selected.proposal as ProposalData).title}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {(selected.proposal as ProposalData).summary}
                                                    </p>
                                                </div>

                                                {/* Collaboration Concept */}
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                                        Collaboration Concept
                                                    </p>
                                                    <p className="text-sm leading-relaxed">
                                                        {(selected.proposal as ProposalData).collaborationConcept}
                                                    </p>
                                                </div>

                                                {/* Deliverables */}
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                        Suggested Deliverables
                                                    </p>
                                                    <div className="space-y-2">
                                                        {(selected.proposal as ProposalData).deliverables?.map((d, i) => (
                                                            <div key={i} className="flex items-start gap-2 bg-muted/20 rounded-lg p-2.5">
                                                                <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">
                                                                    {d.platform}
                                                                </Badge>
                                                                <div>
                                                                    <p className="text-sm font-medium">{d.type}</p>
                                                                    <p className="text-xs text-muted-foreground">{d.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Audience Stats */}
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                                        Audience Stats
                                                    </p>
                                                    <p className="text-sm leading-relaxed">
                                                        {(selected.proposal as ProposalData).audienceStats}
                                                    </p>
                                                </div>

                                                {/* Timeline */}
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                        Proposed Timeline
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {(selected.proposal as ProposalData).timeline?.map((t, i) => (
                                                            <div key={i} className="flex items-center gap-3 text-sm">
                                                                <span className="text-xs font-medium text-brand bg-brand/10 px-2 py-0.5 rounded shrink-0">
                                                                    {t.phase}
                                                                </span>
                                                                <span className="text-muted-foreground">{t.milestone}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Next Steps */}
                                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                                                        Next Steps
                                                    </p>
                                                    <p className="text-sm text-emerald-800">
                                                        {(selected.proposal as ProposalData).nextSteps}
                                                    </p>
                                                </div>

                                                {/* Proposal actions */}
                                                {!selected.proposalSentAt && (
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={generateProposal}
                                                            disabled={generatingProposal}
                                                        >
                                                            <Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerate
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
                                                            onClick={markProposalSent}
                                                        >
                                                            <Send className="h-3.5 w-3.5 mr-1" /> Mark Proposal as Sent
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="border-t pt-4 flex items-center gap-2">
                                    {selected.status === "archived" ? (
                                        <Button variant="outline" size="sm" onClick={unarchiveOutreach}>
                                            <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={archiveOutreach}>
                                            <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                                        onClick={() => deleteOutreach(selected.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                    </Button>
                                </div>

                                {/* Timeline */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h3>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Circle className="h-2.5 w-2.5 fill-slate-300 text-slate-300" />
                                            Created {formatDate(selected.createdAt)}
                                        </div>
                                        {selected.email1SentAt && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Circle className="h-2.5 w-2.5 fill-blue-400 text-blue-400" />
                                                Email 1 sent {formatDate(selected.email1SentAt)}
                                            </div>
                                        )}
                                        {selected.email2SentAt && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Circle className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                                Follow-up sent {formatDate(selected.email2SentAt)}
                                            </div>
                                        )}
                                        {selected.repliedAt && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Circle className="h-2.5 w-2.5 fill-cyan-400 text-cyan-400" />
                                                Brand replied {formatDate(selected.repliedAt)}
                                            </div>
                                        )}
                                        {selected.proposalSentAt && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
                                                Proposal sent {formatDate(selected.proposalSentAt)}
                                            </div>
                                        )}
                                        {selected.archivedAt && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Circle className="h-2.5 w-2.5 fill-neutral-400 text-neutral-400" />
                                                Archived {formatDate(selected.archivedAt)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
