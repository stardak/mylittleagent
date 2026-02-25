"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Megaphone,
    Search,
    Filter,
    Calendar,
    DollarSign,
    Building2,
    MoreHorizontal,
    Trash2,
    FileText,
    Sparkles,
    ChevronRight,
    Clock,
    CheckCircle2,
    Package,
    Loader2,
    X,
    Eye,
    Play,
    CreditCard,
    Shield,
    AlignLeft,
    PenTool,
    Send,
    Youtube,
    Instagram,
    Globe,
    Download,
    RefreshCw,
    Hash,
    ThumbsUp,
    ThumbsDown,
    Megaphone as MegaphoneIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface Brand {
    id: string;
    name: string;
    industry: string | null;
}

interface Deliverable {
    id: string;
    type: string;
    platform: string;
    status: string;
    assignedTo: string | null;
    description: string | null;
    dueDate: string | null;
    publishDate: string | null;
}

interface BriefDocument {
    talentContact?: { name: string; email: string };
    brandContact?: { name: string; email: string };
    agencyContact?: { name: string; email: string } | null;
    brand?: string;
    agency?: string | null;
    talent?: string;
    campaign?: string;
    fee?: { amount: string; paymentSchedule: string };
    expenses?: string;
    deliverables?: { platform: string; type: string; description: string; publishDate: string | null; publishUrl: string | null; duration: string }[];
    keyMessages?: { hashtags: string[]; handles: string[]; messages: string[] };
    dosAndDonts?: { dos: string[]; donts: string[] };
    creativeControl?: string[];
    paidPromotion?: string;
    services?: string | null;
    exclusivity?: string;
    usageRights?: string;
    additionalNotes?: string[];
}

interface Campaign {
    id: string;
    brandId: string;
    name: string;
    brief: string | null;
    startDate: string | null;
    endDate: string | null;
    fee: number | null;
    paymentTerms: string | null;
    usageRights: string | null;
    exclusivity: string | null;
    revisionPolicy: string | null;
    status: string;
    contractStatus: string | null;
    briefDocument: BriefDocument | null;
    briefGeneratedAt: string | null;
    createdAt: string;
    updatedAt: string;
    brand: Brand;
    deliverables?: Deliverable[];
    _count: {
        deliverables: number;
        invoices: number;
        tasks: number;
    };
}

// ── Constants ──────────────────────────────────────────────────
const CAMPAIGN_STATUSES = [
    { id: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
    { id: "briefed", label: "Briefed", color: "bg-purple-100 text-purple-700" },
    { id: "in_production", label: "In Production", color: "bg-blue-100 text-blue-700" },
    { id: "in_review", label: "In Review", color: "bg-amber-100 text-amber-700" },
    { id: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
    { id: "published", label: "Published", color: "bg-green-100 text-green-700" },
    { id: "complete", label: "Complete", color: "bg-teal-100 text-teal-700" },
];

const DELIVERABLE_TYPES = [
    "Dedicated YouTube Video",
    "YouTube Integration",
    "IG Reel",
    "IG Story Series",
    "IG Grid Post",
    "IG Carousel",
    "TikTok",
    "Content Production",
    "Blog Post",
    "Other",
];

const DELIVERABLE_PLATFORMS = [
    "YouTube",
    "Instagram",
    "TikTok",
    "Twitter/X",
    "Blog",
    "Brand Channels",
    "Other",
];

const DELIVERABLE_STATUSES = [
    { id: "not_started", label: "Not Started", color: "bg-slate-100 text-slate-600" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
    { id: "draft_ready", label: "Draft Ready", color: "bg-indigo-100 text-indigo-700" },
    { id: "in_review", label: "In Review", color: "bg-amber-100 text-amber-700" },
    { id: "revision_requested", label: "Revision Requested", color: "bg-orange-100 text-orange-700" },
    { id: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
    { id: "scheduled", label: "Scheduled", color: "bg-cyan-100 text-cyan-700" },
    { id: "published", label: "Published", color: "bg-green-100 text-green-700" },
];

// ── Platform icon helper ───────────────────────────────────────
function PlatformIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
    switch (platform.toLowerCase()) {
        case "youtube":
            return <Youtube className={`${className} text-red-600`} />;
        case "instagram":
            return <Instagram className={`${className} text-pink-600`} />;
        case "tiktok":
            return <Play className={`${className} text-slate-800`} />;
        default:
            return <Globe className={`${className} text-slate-500`} />;
    }
}

// ── Main Component ─────────────────────────────────────────────
export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Create dialog
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");
    const [creatingBrand, setCreatingBrand] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: "",
        brandId: "",
        brief: "",
        fee: "",
        startDate: "",
        endDate: "",
        paymentTerms: "net-30",
        usageRights: "",
        exclusivity: "",
    });

    // Detail sheet
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [savingCampaign, setSavingCampaign] = useState(false);
    const [generatingBrief, setGeneratingBrief] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);
    const [isEditingFee, setIsEditingFee] = useState(false);
    const [editFeeValue, setEditFeeValue] = useState("");

    // Deliverable dialog
    const [showAddDeliverable, setShowAddDeliverable] = useState(false);
    const [addingDeliverable, setAddingDeliverable] = useState(false);
    const [newDeliverable, setNewDeliverable] = useState({
        type: "",
        platform: "",
        assignedTo: "",
        description: "",
        dueDate: "",
    });

    // ── Data fetching ──────────────────────────────────────────
    const fetchCampaigns = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

            const res = await fetch(`/api/campaigns?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch campaigns");
            const data = await res.json();
            setCampaigns(data);
        } catch {
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    const fetchBrands = useCallback(async () => {
        try {
            const res = await fetch("/api/brands");
            if (!res.ok) throw new Error("Failed to fetch brands");
            const data = await res.json();
            setBrands(data);
        } catch {
            // silently fail, brands list just won't populate
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
        fetchBrands();
    }, [fetchCampaigns, fetchBrands]);

    // ── Create brand inline ──────────────────────────────────────
    const createBrandInline = async () => {
        if (!newBrandName.trim()) return;
        setCreatingBrand(true);
        try {
            const res = await fetch("/api/brands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newBrandName.trim(), status: "lead" }),
            });
            if (!res.ok) throw new Error("Failed to create brand");
            const created = await res.json();
            setBrands((prev) => [...prev, created]);
            setNewCampaign({ ...newCampaign, brandId: created.id });
            setNewBrandName("");
            toast.success(`Brand "${created.name}" created`);
        } catch {
            toast.error("Failed to create brand");
        } finally {
            setCreatingBrand(false);
        }
    };

    // ── Create campaign ────────────────────────────────────────
    const createCampaign = async () => {
        if (!newCampaign.name || !newCampaign.brandId) {
            toast.error("Campaign name and brand are required");
            return;
        }
        setCreating(true);
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCampaign),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create campaign");
            }
            const created = await res.json();
            setCampaigns((prev) => [created, ...prev]);
            setShowCreate(false);
            setNewCampaign({
                name: "",
                brandId: "",
                brief: "",
                fee: "",
                startDate: "",
                endDate: "",
                paymentTerms: "net-30",
                usageRights: "",
                exclusivity: "",
            });
            toast.success(`Campaign "${created.name}" created`);
        } catch (err: unknown) {
            toast.error((err as Error).message);
        } finally {
            setCreating(false);
        }
    };

    // ── Open detail ────────────────────────────────────────────
    const openDetail = async (campaign: Campaign) => {
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}`);
            if (!res.ok) throw new Error("Failed to fetch campaign");
            const data = await res.json();
            setSelectedCampaign(data);
            setShowDetail(true);
        } catch {
            toast.error("Failed to load campaign details");
        }
    };

    // ── Update campaign ────────────────────────────────────────
    const updateCampaign = async (field: string, value: string | number | null) => {
        if (!selectedCampaign) return;
        setSavingCampaign(true);
        try {
            const res = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            });
            if (!res.ok) throw new Error("Failed to update campaign");
            const updated = await res.json();
            setSelectedCampaign(updated);
            setCampaigns((prev) =>
                prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
        } catch {
            toast.error("Failed to save changes");
        } finally {
            setSavingCampaign(false);
        }
    };

    // ── Delete campaign ────────────────────────────────────────
    const deleteCampaign = async (id: string) => {
        if (!confirm("Delete this campaign? This will also remove all its deliverables.")) return;
        try {
            const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete campaign");
            setCampaigns((prev) => prev.filter((c) => c.id !== id));
            setShowDetail(false);
            toast.success("Campaign deleted");
        } catch {
            toast.error("Failed to delete campaign");
        }
    };

    // ── Add deliverable ────────────────────────────────────────
    const addDeliverable = async () => {
        if (!selectedCampaign || !newDeliverable.type || !newDeliverable.platform) {
            toast.error("Type and platform are required");
            return;
        }
        setAddingDeliverable(true);
        try {
            const res = await fetch("/api/deliverables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaignId: selectedCampaign.id,
                    ...newDeliverable,
                }),
            });
            if (!res.ok) throw new Error("Failed to add deliverable");
            const created = await res.json();
            setSelectedCampaign((prev) =>
                prev ? { ...prev, deliverables: [...(prev.deliverables || []), created] } : prev
            );
            setShowAddDeliverable(false);
            setNewDeliverable({ type: "", platform: "", assignedTo: "", description: "", dueDate: "" });
            toast.success("Deliverable added");
        } catch {
            toast.error("Failed to add deliverable");
        } finally {
            setAddingDeliverable(false);
        }
    };

    // ── Update deliverable status ──────────────────────────────
    const updateDeliverableStatus = async (deliverableId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/deliverables/${deliverableId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update deliverable");
            const updated = await res.json();
            setSelectedCampaign((prev) =>
                prev
                    ? {
                        ...prev,
                        deliverables: prev.deliverables?.map((d) =>
                            d.id === deliverableId ? { ...d, status: updated.status } : d
                        ),
                    }
                    : prev
            );
        } catch {
            toast.error("Failed to update deliverable");
        }
    };

    // ── Delete deliverable ─────────────────────────────────────
    const deleteDeliverable = async (deliverableId: string) => {
        try {
            const res = await fetch(`/api/deliverables/${deliverableId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete deliverable");
            setSelectedCampaign((prev) =>
                prev
                    ? { ...prev, deliverables: prev.deliverables?.filter((d) => d.id !== deliverableId) }
                    : prev
            );
            toast.success("Deliverable removed");
        } catch {
            toast.error("Failed to delete deliverable");
        }
    };

    // ── Generate Brief ─────────────────────────────────────────
    const generateBrief = async () => {
        if (!selectedCampaign) return;
        setGeneratingBrief(true);
        try {
            const res = await fetch(`/api/campaigns/${selectedCampaign.id}/generate-brief`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to generate brief");
            }
            const updated = await res.json();
            setSelectedCampaign(updated);
            setCampaigns((prev) =>
                prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
            toast.success("Brief generated!", { description: "Your Brand Partnership Brief is ready." });
        } catch (err: unknown) {
            toast.error((err as Error).message);
        } finally {
            setGeneratingBrief(false);
        }
    };

    // ── Export PDF ─────────────────────────────────────────────
    const downloadPdf = async () => {
        if (!detailRef.current || !selectedCampaign) return;
        setExportingPdf(true);
        try {
            const dataUrl = await toPng(detailRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                backgroundColor: "#ffffff",
                style: { margin: "0", borderRadius: "0" }
            });
            const pdf = new jsPDF("p", "mm", "a4");
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${selectedCampaign.name.replace(/\s+/g, "-")}-details.pdf`);
            toast.success("PDF downloaded!");
        } catch (err) {
            console.error("Export error:", err);
            toast.error("Failed to export PDF");
        } finally {
            setExportingPdf(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────
    const statusColor = (statusId: string) =>
        CAMPAIGN_STATUSES.find((s) => s.id === statusId)?.color || "bg-slate-100 text-slate-600";

    const statusLabel = (statusId: string) =>
        CAMPAIGN_STATUSES.find((s) => s.id === statusId)?.label || statusId;

    const deliverableStatusColor = (statusId: string) =>
        DELIVERABLE_STATUSES.find((s) => s.id === statusId)?.color || "bg-slate-100 text-slate-600";

    const deliverableStatusLabel = (statusId: string) =>
        DELIVERABLE_STATUSES.find((s) => s.id === statusId)?.label || statusId;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(value);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    const totalPipelineValue = campaigns.reduce((sum, c) => sum + (c.fee || 0), 0);
    const activeCampaigns = campaigns.filter((c) => !["complete", "draft"].includes(c.status));

    // ── Render ──────────────────────────────────────────────────
    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold">Campaigns</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage active brand campaigns and deliverables.
                    </p>
                </div>
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogTrigger asChild>
                        <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                            <Plus className="h-4 w-4" />
                            New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Create Campaign</DialogTitle>
                            <DialogDescription>
                                Link a new campaign to a brand from your pipeline.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Campaign Name *</Label>
                                <Input
                                    placeholder="e.g. Clarks Spring 2026"
                                    value={newCampaign.name}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Brand *</Label>
                                <Select
                                    value={newCampaign.brandId}
                                    onValueChange={(v) => setNewCampaign({ ...newCampaign, brandId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name} {b.industry ? `(${b.industry})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Inline add brand */}
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Or add a new brand..."
                                        value={newBrandName}
                                        onChange={(e) => setNewBrandName(e.target.value)}
                                        className="text-sm h-8"
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createBrandInline(); } }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 h-8 gap-1 text-xs"
                                        onClick={createBrandInline}
                                        disabled={creatingBrand || !newBrandName.trim()}
                                    >
                                        {creatingBrand ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                        Add
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Fee (£)</Label>
                                    <Input
                                        type="number"
                                        placeholder="5000"
                                        value={newCampaign.fee}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, fee: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Terms</Label>
                                    <Select
                                        value={newCampaign.paymentTerms}
                                        onValueChange={(v) => setNewCampaign({ ...newCampaign, paymentTerms: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="on-completion">On Completion</SelectItem>
                                            <SelectItem value="50-50">50% Upfront, 50% on Delivery</SelectItem>
                                            <SelectItem value="net-14">Net 14</SelectItem>
                                            <SelectItem value="net-30">Net 30</SelectItem>
                                            <SelectItem value="net-60">Net 60</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={newCampaign.startDate}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={newCampaign.endDate}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Brief / Description</Label>
                                <Textarea
                                    placeholder="What is this campaign about?"
                                    value={newCampaign.brief}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, brief: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Usage Rights</Label>
                                <Input
                                    placeholder="e.g. Creator channels only, 12 months"
                                    value={newCampaign.usageRights}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, usageRights: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Exclusivity</Label>
                                <Input
                                    placeholder="e.g. No competing shoe brands for 3 months"
                                    value={newCampaign.exclusivity}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, exclusivity: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-brand hover:bg-brand/90 text-white gap-2"
                                onClick={createCampaign}
                                disabled={creating}
                            >
                                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                                Create Campaign
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                                <Megaphone className="h-5 w-5 text-brand" />
                            </div>
                            <div>
                                <p className="text-2xl font-heading font-semibold">{campaigns.length}</p>
                                <p className="text-xs text-muted-foreground">Total Campaigns</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Play className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-heading font-semibold">{activeCampaigns.length}</p>
                                <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-heading font-semibold">{formatCurrency(totalPipelineValue)}</p>
                                <p className="text-xs text-muted-foreground">Total Value</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {CAMPAIGN_STATUSES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Campaign List */}
            {loading ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ) : campaigns.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Megaphone className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="font-heading text-lg font-semibold mb-1">No campaigns yet</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            When you sign deals with brands, create campaigns here to track deliverables, timelines, and content.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4 gap-2"
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Create Your First Campaign
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {campaigns.map((campaign) => (
                        <Card
                            key={campaign.id}
                            className="cursor-pointer transition-all hover:shadow-md hover:border-brand/30"
                            onClick={() => openDetail(campaign)}
                        >
                            <CardContent className="py-4">
                                <div className="flex items-center gap-4">
                                    {/* Left: Status badge + info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-heading font-semibold text-base truncate">
                                                {campaign.name}
                                            </h3>
                                            <Badge className={`${statusColor(campaign.status)} text-xs`}>
                                                {statusLabel(campaign.status)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {campaign.brand?.name}
                                            </span>
                                            {campaign.fee && (
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    {formatCurrency(campaign.fee)}
                                                </span>
                                            )}
                                            {campaign.startDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(campaign.startDate)}
                                                    {campaign.endDate && ` – ${formatDate(campaign.endDate)}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Counts + actions */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1" title="Deliverables">
                                                <Package className="h-3.5 w-3.5" />
                                                {campaign._count.deliverables}
                                            </span>
                                            <span className="flex items-center gap-1" title="Invoices">
                                                <FileText className="h-3.5 w-3.5" />
                                                {campaign._count.invoices}
                                            </span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Campaign Detail Dialog ─────────────────────────────── */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 gap-0 border-0 rounded-2xl bg-white shadow-2xl">
                    <DialogTitle className="sr-only">Campaign Details</DialogTitle>
                    {selectedCampaign && (
                        <div ref={detailRef} className="p-8 bg-white rounded-2xl flex flex-col">
                            <DialogHeader className="pb-6 border-b border-border/40 shrink-0 text-left">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-3 flex-wrap mb-4">
                                            <Badge className={`${statusColor(selectedCampaign.status)} text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full`}>
                                                {statusLabel(selectedCampaign.status)}
                                            </Badge>
                                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5" />
                                                {selectedCampaign.brand?.name}
                                                {selectedCampaign.brand?.industry && <span className="text-muted-foreground/50">· {selectedCampaign.brand.industry}</span>}
                                            </span>
                                        </div>
                                        <DialogTitle className="font-heading text-3xl font-bold tracking-tight truncate leading-tight">
                                            {selectedCampaign.name}
                                        </DialogTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 gap-2 text-zinc-600 font-medium bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hidden sm:flex shrink-0"
                                            onClick={downloadPdf}
                                            disabled={exportingPdf}
                                        >
                                            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Download className="w-4 h-4" />}
                                            Export PDF
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full hover:bg-muted/80">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 font-medium">
                                                <DropdownMenuItem
                                                    className="gap-2.5 cursor-pointer"
                                                    onClick={generateBrief}
                                                    disabled={generatingBrief}
                                                >
                                                    {generatingBrief ? (
                                                        <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> Generating Brief...</>
                                                    ) : (
                                                        <><Sparkles className="h-4 w-4 text-brand" /> Generate Brief</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2.5 cursor-pointer">
                                                    <FileText className="h-4 w-4 text-muted-foreground" /> Generate Contract
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2.5 cursor-pointer">
                                                    <CreditCard className="h-4 w-4 text-muted-foreground" /> Create Invoice
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive gap-2.5 focus:text-destructive cursor-pointer"
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        deleteCampaign(selectedCampaign.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Delete Campaign
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-8 mt-8">
                                {/* Fee & Status Hero */}
                                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-sm">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            Campaign Fee
                                        </div>
                                        {!isEditingFee ? (
                                            <p className="text-4xl font-heading font-light tracking-tight text-zinc-900 group relative inline-flex items-center cursor-pointer hover:text-brand transition-colors" onClick={() => {
                                                setEditFeeValue(selectedCampaign.fee ? selectedCampaign.fee.toString() : "");
                                                setIsEditingFee(true);
                                            }} title="Click to edit">
                                                {selectedCampaign.fee ? formatCurrency(selectedCampaign.fee) : "Set Fee"}
                                            </p>
                                        ) : (
                                            <div className="flex items-center">
                                                <span className="text-2xl font-light text-zinc-400 mr-1">£</span>
                                                <Input
                                                    type="number"
                                                    autoFocus
                                                    value={editFeeValue}
                                                    onChange={(e) => setEditFeeValue(e.target.value)}
                                                    className="text-2xl font-light h-10 w-32 bg-transparent border-0 border-b-2 border-brand rounded-none px-0 focus-visible:ring-0 focus-visible:border-brand shadow-none"
                                                    placeholder="0.00"
                                                    onBlur={() => {
                                                        const val = parseFloat(editFeeValue) || null;
                                                        updateCampaign("fee", val);
                                                        setIsEditingFee(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = parseFloat(editFeeValue) || null;
                                                            updateCampaign("fee", val);
                                                            setIsEditingFee(false);
                                                        } else if (e.key === 'Escape') {
                                                            setIsEditingFee(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full md:w-auto md:min-w-[200px] flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-1">
                                            Status Progress
                                        </div>
                                        <Select
                                            value={selectedCampaign.status}
                                            onValueChange={(v) => updateCampaign("status", v)}
                                        >
                                            <SelectTrigger className="h-11 bg-white border-zinc-200 font-medium shadow-sm hover:border-zinc-300 transition-colors">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CAMPAIGN_STATUSES.map((s) => (
                                                    <SelectItem key={s.id} value={s.id} className="font-medium cursor-pointer py-2.5">{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Key Details Grid */}
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-900 mb-4 tracking-tight">Key Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl bg-white border border-zinc-200/60 shadow-sm p-4 hover:border-zinc-300 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
                                                <CreditCard className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand transition-colors" />
                                                Payment Terms
                                            </div>
                                            <Select
                                                value={selectedCampaign.paymentTerms || ""}
                                                onValueChange={(v) => updateCampaign("paymentTerms", v)}
                                            >
                                                <SelectTrigger className="h-8 text-sm font-medium border-0 p-0 shadow-none hover:bg-zinc-50 rounded-md -ml-2 px-2 transition-colors">
                                                    <SelectValue placeholder="Select terms..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="on-completion">On Completion</SelectItem>
                                                    <SelectItem value="50-50">50/50 Split</SelectItem>
                                                    <SelectItem value="net-14">Net 14</SelectItem>
                                                    <SelectItem value="net-30">Net 30</SelectItem>
                                                    <SelectItem value="net-60">Net 60</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="rounded-xl bg-white border border-zinc-200/60 shadow-sm p-4 hover:border-zinc-300 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
                                                <Shield className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand transition-colors" />
                                                Usage Rights
                                            </div>
                                            <Input
                                                defaultValue={selectedCampaign.usageRights || ""}
                                                onBlur={(e) => updateCampaign("usageRights", e.target.value)}
                                                placeholder="e.g. 12 months organic"
                                                className="h-8 text-sm font-medium border-0 p-0 shadow-none hover:bg-zinc-50 rounded-md -ml-2 px-2 transition-colors placeholder:text-zinc-300 placeholder:font-normal"
                                            />
                                        </div>

                                        <div className="rounded-xl bg-white border border-zinc-200/60 shadow-sm p-4 hover:border-zinc-300 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand transition-colors" />
                                                Start Date
                                            </div>
                                            <Input
                                                type="date"
                                                value={selectedCampaign.startDate?.slice(0, 10) || ""}
                                                onChange={(e) => updateCampaign("startDate", e.target.value)}
                                                className="h-8 text-sm font-medium border-0 p-0 shadow-none hover:bg-zinc-50 rounded-md -ml-2 px-2 transition-colors cursor-pointer"
                                            />
                                        </div>

                                        <div className="rounded-xl bg-white border border-zinc-200/60 shadow-sm p-4 hover:border-zinc-300 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand transition-colors" />
                                                End Date
                                            </div>
                                            <Input
                                                type="date"
                                                value={selectedCampaign.endDate?.slice(0, 10) || ""}
                                                onChange={(e) => updateCampaign("endDate", e.target.value)}
                                                className="h-8 text-sm font-medium border-0 p-0 shadow-none hover:bg-zinc-50 rounded-md -ml-2 px-2 transition-colors cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Exclusivity */}
                                <div className="rounded-xl bg-white border border-zinc-200/60 shadow-sm p-4 hover:border-zinc-300 transition-all group">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
                                        <Shield className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                                        Exclusivity Restrictions
                                    </div>
                                    <Input
                                        defaultValue={selectedCampaign.exclusivity || ""}
                                        onBlur={(e) => updateCampaign("exclusivity", e.target.value)}
                                        placeholder="e.g. No competing fashion brands for 30 days before/after"
                                        className="h-8 text-sm font-medium border-0 p-0 shadow-none hover:bg-zinc-50 rounded-md -ml-2 px-2 transition-colors placeholder:text-zinc-300 placeholder:font-normal"
                                    />
                                </div>

                                {/* Brief / Description */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 tracking-tight">
                                        <AlignLeft className="w-4 h-4 text-zinc-400" />
                                        Campaign Brief
                                    </div>
                                    <Textarea
                                        defaultValue={selectedCampaign.brief || ""}
                                        onBlur={(e) => updateCampaign("brief", e.target.value)}
                                        placeholder="Add campaign hooks, key messaging, and visual references here..."
                                        rows={4}
                                        className="resize-none min-h-[120px] rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white text-sm leading-relaxed p-4 shadow-sm placeholder:text-zinc-400"
                                    />
                                </div>

                                <Separator />

                                {/* ── Deliverables Section ───────────────────────── */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Deliverables ({selectedCampaign.deliverables?.length || 0})
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 text-xs h-7"
                                            onClick={() => setShowAddDeliverable(true)}
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add
                                        </Button>
                                    </div>

                                    {!selectedCampaign.deliverables?.length ? (
                                        <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            No deliverables yet. Add what you&apos;re creating for this campaign.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedCampaign.deliverables.map((d) => (
                                                <div
                                                    key={d.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                                                >
                                                    <PlatformIcon platform={d.platform} className="h-5 w-5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{d.type}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {d.platform}
                                                            {d.assignedTo && ` · ${d.assignedTo}`}
                                                            {d.dueDate && ` · Due ${formatDate(d.dueDate)}`}
                                                        </p>
                                                    </div>
                                                    <Select
                                                        value={d.status}
                                                        onValueChange={(v) => updateDeliverableStatus(d.id, v)}
                                                    >
                                                        <SelectTrigger className="w-[130px] h-7 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {DELIVERABLE_STATUSES.map((s) => (
                                                                <SelectItem key={s.id} value={s.id}>
                                                                    {s.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() => deleteDeliverable(d.id)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* ── Generated Brief Section ───────────────────── */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Partnership Brief
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 text-xs h-7"
                                            onClick={generateBrief}
                                            disabled={generatingBrief}
                                        >
                                            {generatingBrief ? (
                                                <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                                            ) : selectedCampaign.briefDocument ? (
                                                <><RefreshCw className="h-3 w-3" /> Regenerate</>
                                            ) : (
                                                <><Sparkles className="h-3 w-3" /> Generate</>
                                            )}
                                        </Button>
                                    </div>

                                    {generatingBrief ? (
                                        <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-lg">
                                            <Loader2 className="h-8 w-8 animate-spin text-brand mb-3" />
                                            <p className="text-sm font-medium">Generating your brief...</p>
                                            <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                                        </div>
                                    ) : selectedCampaign.briefDocument ? (
                                        <BriefDisplay brief={selectedCampaign.briefDocument as BriefDocument} generatedAt={selectedCampaign.briefGeneratedAt} />
                                    ) : (
                                        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No brief generated yet.</p>
                                            <p className="text-xs mt-1">Click &ldquo;Generate&rdquo; to create a professional partnership brief.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Saving indicator */}
                                {savingCampaign && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Saving...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Add Deliverable Dialog ─────────────────────────────── */}
            <Dialog open={showAddDeliverable} onOpenChange={setShowAddDeliverable}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Add Deliverable</DialogTitle>
                        <DialogDescription>
                            What content are you creating for this campaign?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Content Type *</Label>
                            <Select
                                value={newDeliverable.type}
                                onValueChange={(v) => setNewDeliverable({ ...newDeliverable, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DELIVERABLE_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Platform *</Label>
                            <Select
                                value={newDeliverable.platform}
                                onValueChange={(v) => setNewDeliverable({ ...newDeliverable, platform: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DELIVERABLE_PLATFORMS.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Assigned To</Label>
                                <Input
                                    placeholder="e.g. Hannah"
                                    value={newDeliverable.assignedTo}
                                    onChange={(e) => setNewDeliverable({ ...newDeliverable, assignedTo: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={newDeliverable.dueDate}
                                    onChange={(e) => setNewDeliverable({ ...newDeliverable, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Any notes about this deliverable..."
                                value={newDeliverable.description}
                                onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDeliverable(false)} disabled={addingDeliverable}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-brand hover:bg-brand/90 text-white gap-2"
                            onClick={addDeliverable}
                            disabled={addingDeliverable}
                        >
                            {addingDeliverable && <Loader2 className="h-4 w-4 animate-spin" />}
                            Add Deliverable
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

// ── Brief Display Component ─────────────────────────────────────────
function BriefSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-brand">{title}</h4>
            <div className="text-sm text-foreground">{children}</div>
        </div>
    );
}

function BriefDisplay({ brief, generatedAt }: { brief: BriefDocument; generatedAt: string | null }) {
    return (
        <div className="border rounded-lg bg-card overflow-hidden">
            {/* Header */}
            <div className="bg-brand/5 border-b px-4 py-3">
                <h3 className="font-heading font-semibold text-base">Brand Partnership Brief</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {generatedAt
                        ? `Generated ${new Date(generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                        : "AI-generated brief"}
                </p>
            </div>

            <div className="p-4 space-y-5 text-sm">
                {/* Disclaimer */}
                <p className="text-xs italic text-muted-foreground bg-amber-50 border border-amber-200 rounded p-2.5">
                    This Brand Partnership Brief is subject to signed contract. Please ensure all details in this document are reflected in the final contract prior to signature.
                </p>

                {/* Contacts */}
                <div className="grid grid-cols-2 gap-4">
                    {brief.talentContact && (
                        <BriefSection title="Talent Contact">
                            <p className="font-medium">{brief.talentContact.name}</p>
                            <p className="text-muted-foreground">{brief.talentContact.email}</p>
                        </BriefSection>
                    )}
                    {brief.brandContact && (
                        <BriefSection title="Brand/Agency Contact">
                            <p className="font-medium">{brief.brandContact.name}</p>
                            <p className="text-muted-foreground">{brief.brandContact.email}</p>
                            {brief.agencyContact && (
                                <div className="mt-1">
                                    <p className="font-medium">{brief.agencyContact.name}</p>
                                    <p className="text-muted-foreground">{brief.agencyContact.email}</p>
                                </div>
                            )}
                        </BriefSection>
                    )}
                </div>

                <Separator />

                {/* Campaign Overview */}
                <div className="grid grid-cols-2 gap-4">
                    {brief.brand && (
                        <BriefSection title="Brand">
                            <p>{brief.brand}</p>
                            {brief.agency && <p className="text-xs text-muted-foreground">Agency: {brief.agency}</p>}
                        </BriefSection>
                    )}
                    {brief.talent && (
                        <BriefSection title="Talent">
                            <p>{brief.talent}</p>
                        </BriefSection>
                    )}
                </div>

                {brief.campaign && (
                    <BriefSection title="Campaign">
                        <p>{brief.campaign}</p>
                    </BriefSection>
                )}

                {/* Fee */}
                {brief.fee && (
                    <BriefSection title="Fee">
                        <p className="font-semibold text-base">{brief.fee.amount}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{brief.fee.paymentSchedule}</p>
                    </BriefSection>
                )}

                {/* Expenses */}
                {brief.expenses && (
                    <BriefSection title="Expenses">
                        <p>{brief.expenses}</p>
                    </BriefSection>
                )}

                <Separator />

                {/* Deliverables */}
                {brief.deliverables && brief.deliverables.length > 0 && (
                    <BriefSection title="Deliverables">
                        <div className="space-y-3">
                            {brief.deliverables.map((d, i) => (
                                <div key={i} className="p-2.5 bg-muted/30 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <PlatformIcon platform={d.platform} className="h-4 w-4" />
                                        <span className="font-medium">{d.type}</span>
                                        <span className="text-xs text-muted-foreground">on {d.platform}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{d.description}</p>
                                    {d.publishDate && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Publish: {d.publishDate}
                                        </p>
                                    )}
                                    {d.duration && (
                                        <p className="text-xs text-muted-foreground">
                                            Live for: {d.duration}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </BriefSection>
                )}

                {/* Key Messages */}
                {brief.keyMessages && (
                    <BriefSection title="Key Messages">
                        {brief.keyMessages.hashtags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {brief.keyMessages.hashtags.map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        {tag.startsWith("#") ? tag : `#${tag}`}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {brief.keyMessages.handles?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {brief.keyMessages.handles.map((handle, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                        {handle}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {brief.keyMessages.messages?.length > 0 && (
                            <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                                {brief.keyMessages.messages.map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        )}
                    </BriefSection>
                )}

                <Separator />

                {/* Dos and Don'ts */}
                {brief.dosAndDonts && (
                    <div className="grid grid-cols-2 gap-4">
                        {brief.dosAndDonts.dos?.length > 0 && (
                            <BriefSection title="Do's">
                                <ul className="space-y-1">
                                    {brief.dosAndDonts.dos.map((item, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs">
                                            <ThumbsUp className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </BriefSection>
                        )}
                        {brief.dosAndDonts.donts?.length > 0 && (
                            <BriefSection title="Don'ts">
                                <ul className="space-y-1">
                                    {brief.dosAndDonts.donts.map((item, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs">
                                            <ThumbsDown className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </BriefSection>
                        )}
                    </div>
                )}

                {/* Creative Control */}
                {brief.creativeControl && brief.creativeControl.length > 0 && (
                    <BriefSection title="Creative Control">
                        <ul className="space-y-1">
                            {brief.creativeControl.map((item, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs">
                                    <CheckCircle2 className="h-3 w-3 text-brand shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </BriefSection>
                )}

                {/* Paid Promotion */}
                {brief.paidPromotion && (
                    <BriefSection title="Paid Promotion">
                        <p>{brief.paidPromotion}</p>
                    </BriefSection>
                )}

                {/* Services */}
                {brief.services && (
                    <BriefSection title="Services">
                        <p>{brief.services}</p>
                    </BriefSection>
                )}

                <Separator />

                {/* Exclusivity & Usage */}
                <div className="grid grid-cols-2 gap-4">
                    {brief.exclusivity && (
                        <BriefSection title="Commercial Exclusivity">
                            <p>{brief.exclusivity}</p>
                        </BriefSection>
                    )}
                    {brief.usageRights && (
                        <BriefSection title="Usage Rights">
                            <p>{brief.usageRights}</p>
                        </BriefSection>
                    )}
                </div>

                {/* Additional Notes */}
                {brief.additionalNotes && brief.additionalNotes.length > 0 && (
                    <BriefSection title="Additional Notes">
                        <ul className="space-y-1">
                            {brief.additionalNotes.map((note, i) => (
                                <li key={i} className="text-xs text-muted-foreground">• {note}</li>
                            ))}
                        </ul>
                    </BriefSection>
                )}
            </div>
        </div>
    );
}
