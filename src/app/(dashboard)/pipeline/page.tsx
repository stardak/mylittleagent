"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
    Filter,
    List,
    LayoutGrid,
    GripVertical,
    ExternalLink,
    Mail,
    Phone,
    Calendar,
    Building2,
    DollarSign,
    MoreHorizontal,
    X,
    ChevronRight,
    Clock,
    TrendingUp,
    User,
    Globe,
    Tag,
    MessageSquare,
    FileText,
    Sparkles,
    Trash2,
    Megaphone,
    Loader2,
} from "lucide-react";
import Link from "next/link";

type Brand = {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    contactName: string | null;
    contactTitle: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    source: string | null;
    brandFitScore: number | null;
    estimatedValue: number | null;
    pipelineStage: string;
    nextFollowUp: string | null;
    nextAction: string | null;
    notes: string | null;
    tags: string[];
    lostReason: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: { campaigns: number; emails: number };
    campaigns?: { id: string; name: string; status: string; fee: number }[];
    activities?: { id: string; type: string; description: string; createdAt: string }[];
};

const PIPELINE_STAGES = [
    { id: "research", label: "Research", color: "bg-slate-100 text-slate-700" },
    { id: "outreach", label: "Outreach", color: "bg-blue-100 text-blue-700" },
    { id: "responded", label: "Responded", color: "bg-cyan-100 text-cyan-700" },
    { id: "meeting", label: "Meeting", color: "bg-violet-100 text-violet-700" },
    { id: "negotiation", label: "Negotiation", color: "bg-amber-100 text-amber-700" },
    { id: "proposal", label: "Proposal", color: "bg-orange-100 text-orange-700" },
    { id: "contracted", label: "Contracted", color: "bg-emerald-100 text-emerald-700" },
    { id: "production", label: "Production", color: "bg-teal-100 text-teal-700" },
    { id: "delivered", label: "Delivered", color: "bg-green-100 text-green-700" },
    { id: "invoiced", label: "Invoiced", color: "bg-lime-100 text-lime-700" },
    { id: "paid", label: "Paid", color: "bg-emerald-100 text-emerald-800" },
    { id: "nurture", label: "Nurture", color: "bg-purple-100 text-purple-700" },
    { id: "lost", label: "Lost", color: "bg-red-100 text-red-700" },
];

const INDUSTRIES = [
    "Automotive", "Beauty & Cosmetics", "Fashion", "FinTech", "Food & Beverage",
    "Health & Wellness", "Home & Garden", "Retail", "Sports & Fitness",
    "Technology", "Toys & Games", "Travel & Hospitality", "Other",
];

export default function PipelinePage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [loading, setLoading] = useState(true);
    const [showNewBrand, setShowNewBrand] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editNotesValue, setEditNotesValue] = useState("");
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [editContact, setEditContact] = useState({ name: "", email: "", phone: "", website: "" });
    const [findingContact, setFindingContact] = useState(false);
    type ContactCandidate = { name: string | null; role: string | null; email: string | null; source: string; snippet: string };
    const [contactResults, setContactResults] = useState<ContactCandidate[]>([]);
    const [draggedBrand, setDraggedBrand] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [newBrandFindingContact, setNewBrandFindingContact] = useState(false);
    type NewBrandContactCandidate = { name: string | null; role: string | null; email: string | null; source: string; snippet: string; verified?: boolean };
    const [newBrandContactResults, setNewBrandContactResults] = useState<NewBrandContactCandidate[]>([]);

    // New brand form state
    const [newBrand, setNewBrand] = useState({
        name: "",
        industry: "",
        website: "",
        contactName: "",
        contactEmail: "",
        estimatedValue: "",
        source: "",
        notes: "",
        pipelineStage: "research",
    });

    const fetchBrands = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            const res = await fetch(`/api/brands?${params}`);
            if (res.ok) {
                const data = await res.json();
                setBrands(data);
            }
        } catch (error) {
            console.error("Failed to fetch brands:", error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const createBrand = async () => {
        if (!newBrand.name.trim()) return;
        setCreateError(null);
        setSaving(true);
        try {
            const res = await fetch("/api/brands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBrand),
            });
            if (res.ok) {
                setShowNewBrand(false);
                setNewBrand({
                    name: "", industry: "", website: "", contactName: "",
                    contactEmail: "", estimatedValue: "", source: "", notes: "",
                    pipelineStage: "research",
                });
                setCreateError(null);
                fetchBrands();
            } else {
                const data = await res.json().catch(() => ({}));
                setCreateError(data.error || `Failed to save brand (${res.status}). Please try logging in again.`);
            }
        } catch (error) {
            console.error("Failed to create brand:", error);
            setCreateError("Network error — couldn't reach the server.");
        } finally {
            setSaving(false);
        }
    };

    const updateBrandStage = async (brandId: string, newStage: string) => {
        // Optimistic update
        setBrands((prev) =>
            prev.map((b) => (b.id === brandId ? { ...b, pipelineStage: newStage } : b))
        );

        try {
            await fetch(`/api/brands/${brandId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pipelineStage: newStage }),
            });
        } catch (error) {
            console.error("Failed to update brand stage:", error);
            fetchBrands(); // Revert on error
        }
    };

    const openBrandDetail = async (brand: Brand) => {
        try {
            const res = await fetch(`/api/brands/${brand.id}`);
            if (res.ok) {
                const fullBrand = await res.json();
                setSelectedBrand(fullBrand);
                setShowDetail(true);
            }
        } catch (error) {
            console.error("Failed to fetch brand details:", error);
        }
    };

    // Drag handlers
    const handleDragStart = (brandId: string) => {
        setDraggedBrand(brandId);
    };

    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDragOverStage(stageId);
    };

    const handleDragLeave = () => {
        setDragOverStage(null);
    };

    const handleDrop = (stageId: string) => {
        if (draggedBrand) {
            updateBrandStage(draggedBrand, stageId);
        }
        setDraggedBrand(null);
        setDragOverStage(null);
    };

    const getBrandsForStage = (stageId: string) =>
        brands.filter((b) => b.pipelineStage === stageId);

    const getStageValue = (stageId: string) =>
        getBrandsForStage(stageId).reduce((sum, b) => sum + (b.estimatedValue || 0), 0);

    const totalPipelineValue = brands.reduce((sum, b) => sum + (b.estimatedValue || 0), 0);

    const stageColor = (stageId: string) =>
        PIPELINE_STAGES.find((s) => s.id === stageId)?.color || "";

    const formatCurrency = (value: number) => {
        if (value >= 1000) return `£${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
        return `£${value.toLocaleString()}`;
    };

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

    const [deleting, setDeleting] = useState(false);
    const [creatingOutreach, setCreatingOutreach] = useState(false);
    const router = useRouter();

    const startOutreach = async (brand: Brand, mode: "pitch" | "email") => {
        if (!brand.contactEmail) {
            toast.error("No contact email", { description: "Add a contact email to this brand first." });
            return;
        }
        setCreatingOutreach(true);
        try {
            const res = await fetch("/api/outreach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brandName: brand.name,
                    contactEmail: brand.contactEmail,
                    brandIndustry: brand.industry || "",
                    brandUrl: brand.website || "",
                    product: "",
                    fitReason: "",
                }),
            });
            if (res.ok) {
                const outreach = await res.json();
                toast.success(
                    mode === "pitch" ? "Outreach created — generate your pitch!" : "Outreach created — send your email!",
                    { description: `Opened ${brand.name} in Brand Outreach.` }
                );
                router.push(`/outreach?open=${outreach.id}`);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error("Failed to create outreach", { description: data.error });
            }
        } catch {
            toast.error("Network error");
        } finally {
            setCreatingOutreach(false);
        }
    };

    const deleteBrand = async (brandId: string) => {
        if (!confirm("Are you sure you want to delete this brand? This cannot be undone.")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/brands/${brandId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete brand");
            setBrands(brands.filter((b) => b.id !== brandId));
            setShowDetail(false);
            setSelectedBrand(null);
            toast.success("Brand deleted", { description: "The brand has been removed from your pipeline." });
        } catch (error) {
            console.error("Failed to delete brand:", error);
            toast.error("Failed to delete brand", { description: "Please try again." });
        } finally {
            setDeleting(false);
        }
    };

    const updateBrandNotes = async (brandId: string, notes: string) => {
        try {
            const res = await fetch(`/api/brands/${brandId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
            });
            if (!res.ok) throw new Error("Failed to update notes");

            setBrands(brands.map((b) =>
                b.id === brandId ? { ...b, notes } : b
            ));

            if (selectedBrand && selectedBrand.id === brandId) {
                setSelectedBrand({ ...selectedBrand, notes });
            }

            setIsEditingNotes(false);
            toast.success("Notes updated");
        } catch (error) {
            console.error("Failed to update notes:", error);
            toast.error("Failed to update notes");
        }
    };

    const updateBrandContact = async (brandId: string, contact: { name: string; email: string; phone: string; website: string }) => {
        try {
            const res = await fetch(`/api/brands/${brandId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactName: contact.name || null,
                    contactEmail: contact.email || null,
                    contactPhone: contact.phone || null,
                    website: contact.website || null,
                }),
            });
            if (!res.ok) throw new Error("Failed");

            const patch = {
                contactName: contact.name || null,
                contactEmail: contact.email || null,
                contactPhone: contact.phone || null,
                website: contact.website || null,
            };
            setBrands(brands.map((b) => b.id === brandId ? { ...b, ...patch } : b));
            if (selectedBrand?.id === brandId) setSelectedBrand({ ...selectedBrand, ...patch });
            setIsEditingContact(false);
            setContactResults([]);
            toast.success("Contact updated");
        } catch {
            toast.error("Failed to update contact");
        }
    };

    const findBrandContact = async (brand: { name: string; website?: string | null }) => {
        setFindingContact(true);
        setContactResults([]);
        try {
            const res = await fetch("/api/brands/find-contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brandName: brand.name, website: brand.website }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Search failed");
                return;
            }
            if (!data.candidates?.length) {
                toast.info("No contacts found", { description: "Try adding a website URL to the brand and searching again." });
                return;
            }
            setContactResults(data.candidates);
            setIsEditingContact(true); // auto-open edit form
        } catch {
            toast.error("Network error — couldn't reach Tavily");
        } finally {
            setFindingContact(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-heading font-semibold">Brand Pipeline</h1>
                        <p className="text-muted-foreground mt-1">
                            {brands.length} brands · {formatCurrency(totalPipelineValue)} total value
                        </p>
                    </div>
                    <Dialog open={showNewBrand} onOpenChange={setShowNewBrand}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                                <Plus className="h-4 w-4" />
                                Add Brand
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="font-heading text-xl">Add New Brand</DialogTitle>
                                <DialogDescription>
                                    Add a new brand to your pipeline. You can fill in more details later.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand-name">Brand Name *</Label>
                                        <Input
                                            id="brand-name"
                                            placeholder="e.g. Nike"
                                            value={newBrand.name}
                                            onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brand-industry">Industry</Label>
                                        <select
                                            id="brand-industry"
                                            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                            value={newBrand.industry}
                                            onChange={(e) => setNewBrand({ ...newBrand, industry: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {INDUSTRIES.map((ind) => (
                                                <option key={ind} value={ind}>{ind}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Contact</Label>
                                        <button
                                            type="button"
                                            disabled={!newBrand.name.trim() || newBrandFindingContact}
                                            onClick={async () => {
                                                if (!newBrand.name.trim()) return;
                                                setNewBrandFindingContact(true);
                                                setNewBrandContactResults([]);
                                                try {
                                                    const res = await fetch("/api/brands/find-contact", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ brandName: newBrand.name, website: newBrand.website }),
                                                    });
                                                    const data = await res.json();
                                                    if (res.ok && data.candidates?.length > 0) {
                                                        setNewBrandContactResults(data.candidates);
                                                    } else {
                                                        toast.info("No contacts found", { description: "Try adding the website URL first for better results." });
                                                    }
                                                } catch {
                                                    toast.error("Search failed");
                                                } finally {
                                                    setNewBrandFindingContact(false);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {newBrandFindingContact ? (
                                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</>
                                            ) : (
                                                <><Sparkles className="h-3.5 w-3.5" /> Find Contact with AI</>
                                            )}
                                        </button>
                                    </div>

                                    {/* AI results for new brand */}
                                    {newBrandContactResults.length > 0 && (
                                        <div className="rounded-lg border border-brand/20 bg-brand/5 divide-y overflow-hidden">
                                            <p className="text-[10px] font-semibold text-brand uppercase tracking-wider px-3 pt-2 pb-1">Select a contact to auto-fill</p>
                                            {newBrandContactResults.map((c, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewBrand({
                                                            ...newBrand,
                                                            contactName: c.name || newBrand.contactName,
                                                            contactEmail: c.email || newBrand.contactEmail,
                                                        });
                                                        setNewBrandContactResults([]);
                                                        toast.success("Contact pre-filled");
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-brand/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium truncate">
                                                                {c.name || <span className="text-muted-foreground italic">Name unknown</span>}
                                                                {c.role && <span className="text-muted-foreground font-normal"> · {c.role}</span>}
                                                                {c.verified && <span className="ml-1.5 text-[10px] text-green-600 font-semibold">✓ verified</span>}
                                                            </p>
                                                            {c.email && <p className="text-[10px] text-brand truncate">{c.email}</p>}
                                                        </div>
                                                        <ChevronRight className="h-3.5 w-3.5 text-brand/50 shrink-0" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="brand-contact">Name</Label>
                                            <Input
                                                id="brand-contact"
                                                placeholder="Jane Smith"
                                                value={newBrand.contactName}
                                                onChange={(e) => setNewBrand({ ...newBrand, contactName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="brand-email">Email</Label>
                                            <Input
                                                id="brand-email"
                                                type="email"
                                                placeholder="jane@brand.com"
                                                value={newBrand.contactEmail}
                                                onChange={(e) => setNewBrand({ ...newBrand, contactEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand-value">Estimated Value (£)</Label>
                                        <Input
                                            id="brand-value"
                                            type="number"
                                            placeholder="10000"
                                            value={newBrand.estimatedValue}
                                            onChange={(e) => setNewBrand({ ...newBrand, estimatedValue: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brand-source">Source</Label>
                                        <select
                                            id="brand-source"
                                            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                            value={newBrand.source}
                                            onChange={(e) => setNewBrand({ ...newBrand, source: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            <option value="inbound">Inbound</option>
                                            <option value="outbound">Outbound</option>
                                            <option value="referral">Referral</option>
                                            <option value="agency">Agency</option>
                                            <option value="event">Event</option>
                                            <option value="repeat">Repeat Client</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand-website">Website</Label>
                                    <Input
                                        id="brand-website"
                                        type="url"
                                        placeholder="https://www.brand.com"
                                        value={newBrand.website}
                                        onChange={(e) => setNewBrand({ ...newBrand, website: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand-notes">Notes</Label>
                                    <Textarea
                                        id="brand-notes"
                                        rows={2}
                                        placeholder="Any initial notes..."
                                        value={newBrand.notes}
                                        onChange={(e) => setNewBrand({ ...newBrand, notes: e.target.value })}
                                        className="resize-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-3 pt-2">
                                    {createError && (
                                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{createError}</p>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={() => { setShowNewBrand(false); setCreateError(null); }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-brand hover:bg-brand/90 text-white"
                                            onClick={createBrand}
                                            disabled={!newBrand.name.trim() || saving}
                                        >
                                            {saving ? "Saving..." : "Add to Pipeline"}
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
                            placeholder="Search brands..."
                            className="pl-10 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => toast.info("Filters coming soon", { description: "Advanced filtering by stage, industry, and value is on the roadmap." })}>
                        <Filter className="h-4 w-4" />
                    </Button>
                    <div className="flex border rounded-lg overflow-hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-none ${viewMode === "kanban" ? "bg-accent" : ""}`}
                            onClick={() => setViewMode("kanban")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-none ${viewMode === "list" ? "bg-accent" : ""}`}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Kanban View */}
            {viewMode === "kanban" && (
                <div className="overflow-x-auto pb-4 -mx-8 px-8">
                    <div className="flex gap-3 min-w-max">
                        {PIPELINE_STAGES.map((stage) => {
                            const stageBrands = getBrandsForStage(stage.id);
                            const stageValue = getStageValue(stage.id);
                            const isDragOver = dragOverStage === stage.id;

                            return (
                                <div
                                    key={stage.id}
                                    className="flex-shrink-0 w-44"
                                    onDragOver={(e) => handleDragOver(e, stage.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={() => handleDrop(stage.id)}
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold">{stage.label}</h3>
                                            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                                {stageBrands.length}
                                            </span>
                                        </div>
                                        {stageValue > 0 && (
                                            <span className="text-xs font-medium text-brand">
                                                {formatCurrency(stageValue)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Column Body */}
                                    <div
                                        className={`rounded-lg p-2 min-h-[200px] transition-colors ${isDragOver
                                            ? "bg-brand/10 border-2 border-brand/30 border-dashed"
                                            : "bg-muted/50 border border-dashed border-border/50"
                                            }`}
                                    >
                                        <div className="space-y-2">
                                            {stageBrands.map((brand) => (
                                                <Card
                                                    key={brand.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(brand.id)}
                                                    onClick={() => openBrandDetail(brand)}
                                                    className={`cursor-pointer hover:shadow-md transition-all group ${draggedBrand === brand.id ? "opacity-50 scale-95" : ""
                                                        }`}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                                            <h4 className="font-medium text-sm truncate">
                                                                {brand.name}
                                                            </h4>
                                                        </div>
                                                        {brand.industry && (
                                                            <p className="text-xs text-muted-foreground mt-1 ml-5.5">
                                                                {brand.industry}
                                                            </p>
                                                        )}

                                                        {/* Card meta */}
                                                        <div className="flex items-center gap-3 mt-2 ml-5.5">
                                                            {brand.contactName && (
                                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <User className="h-3 w-3" />
                                                                    {brand.contactName}
                                                                </span>
                                                            )}
                                                            {brand.nextFollowUp && (
                                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(brand.nextFollowUp).toLocaleDateString("en-GB", {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Price */}
                                                        {brand.estimatedValue && brand.estimatedValue > 0 && (
                                                            <div className="mt-2 ml-5.5">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {formatCurrency(brand.estimatedValue)}
                                                                </Badge>
                                                            </div>
                                                        )}

                                                        {/* Tags */}
                                                        {brand.tags && brand.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2 ml-5.5">
                                                                {brand.tags.slice(0, 3).map((tag) => (
                                                                    <span
                                                                        key={tag}
                                                                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                                {brand.tags.length > 3 && (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        +{brand.tags.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Empty state */}
                                        {stageBrands.length === 0 && !isDragOver && (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <p className="text-xs text-muted-foreground">Drop brands here</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Brand
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Industry
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Stage
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Value
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Updated
                                </th>
                                <th className="w-12 px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {brands.map((brand) => (
                                <tr
                                    key={brand.id}
                                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                                    onClick={() => openBrandDetail(brand)}
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-sm">{brand.name}</p>
                                            {brand.source && (
                                                <p className="text-xs text-muted-foreground">{brand.source}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {brand.industry || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className={`text-xs ${stageColor(brand.pipelineStage)}`}>
                                            {PIPELINE_STAGES.find((s) => s.id === brand.pipelineStage)?.label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm">
                                            <p>{brand.contactName || "—"}</p>
                                            {brand.contactEmail && (
                                                <p className="text-xs text-muted-foreground">{brand.contactEmail}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-medium">
                                        {brand.estimatedValue ? formatCurrency(brand.estimatedValue) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {timeAgo(brand.updatedAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {brands.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-muted-foreground font-medium">No brands yet</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Add your first brand to start building your pipeline.
                                        </p>
                                        <Button
                                            className="bg-brand hover:bg-brand/90 text-white gap-2 mt-4"
                                            onClick={(e) => { e.stopPropagation(); setShowNewBrand(true); }}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Brand
                                        </Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Brand Detail Sheet */}
            <Sheet open={showDetail} onOpenChange={(open) => {
                setShowDetail(open);
                if (!open) {
                    setIsEditingNotes(false);
                }
            }}>
                <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
                    {selectedBrand && (
                        <>
                            {/* Hero Header */}
                            <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-transparent px-6 pt-6 pb-5">
                                <SheetHeader className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-14 w-14 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
                                            <span className="text-xl font-heading font-bold text-brand">
                                                {selectedBrand.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <SheetTitle className="font-heading text-xl truncate">
                                                {selectedBrand.name}
                                            </SheetTitle>
                                            <SheetDescription className="flex items-center gap-2 mt-1">
                                                <Badge className={`${stageColor(selectedBrand.pipelineStage)} text-xs`}>
                                                    {PIPELINE_STAGES.find((s) => s.id === selectedBrand.pipelineStage)?.label}
                                                </Badge>
                                                {selectedBrand.industry && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {selectedBrand.industry}
                                                    </span>
                                                )}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3 mt-5">
                                    <div className="bg-white/80 backdrop-blur border rounded-xl p-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <DollarSign className="h-3.5 w-3.5 text-brand" />
                                        </div>
                                        <p className="text-lg font-heading font-bold">
                                            {selectedBrand.estimatedValue ? formatCurrency(selectedBrand.estimatedValue) : "—"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Est. Value</p>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur border rounded-xl p-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <FileText className="h-3.5 w-3.5 text-violet-500" />
                                        </div>
                                        <p className="text-lg font-heading font-bold">
                                            {selectedBrand._count?.campaigns || 0}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Campaigns</p>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur border rounded-xl p-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Mail className="h-3.5 w-3.5 text-sky-500" />
                                        </div>
                                        <p className="text-lg font-heading font-bold">
                                            {selectedBrand._count?.emails || 0}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Emails</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 pb-6 space-y-5 mt-1">
                                {/* Contact Card */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
                                        {!isEditingContact && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-muted-foreground gap-1 hover:text-brand"
                                                    disabled={findingContact}
                                                    onClick={() => findBrandContact(selectedBrand)}
                                                >
                                                    {findingContact ? (
                                                        <><Loader2 className="h-3 w-3 animate-spin" /> Searching...</>
                                                    ) : (
                                                        <><Sparkles className="h-3 w-3" /> Find with AI</>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-brand gap-1"
                                                    onClick={() => {
                                                        setEditContact({
                                                            name: selectedBrand.contactName || "",
                                                            email: selectedBrand.contactEmail || "",
                                                            phone: selectedBrand.contactPhone || "",
                                                            website: selectedBrand.website || "",
                                                        });
                                                        setContactResults([]);
                                                        setIsEditingContact(true);
                                                    }}
                                                >
                                                    {(selectedBrand.contactName || selectedBrand.contactEmail) ? "Edit" : "Add Contact"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {isEditingContact ? (
                                            <div className="space-y-3">
                                                {/* AI Results */}
                                                {contactResults.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                            <Sparkles className="h-3 w-3 text-brand" /> AI found these contacts — click one to fill
                                                        </p>
                                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                                            {contactResults.map((c, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setEditContact({
                                                                        name: c.name || "",
                                                                        email: c.email || "",
                                                                        phone: editContact.phone,
                                                                        website: editContact.website,
                                                                    })}
                                                                    className="w-full text-left px-3 py-2 rounded-lg border bg-background hover:bg-brand/5 hover:border-brand/30 transition-all text-xs group"
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            {c.name && <p className="font-medium truncate group-hover:text-brand">{c.name}</p>}
                                                                            {c.role && <p className="text-muted-foreground truncate">{c.role}</p>}
                                                                            {c.email && <p className="text-brand truncate font-mono">{c.email}</p>}
                                                                        </div>
                                                                        <a
                                                                            href={c.source}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="shrink-0 text-muted-foreground hover:text-brand"
                                                                        >
                                                                            <ExternalLink className="h-3 w-3" />
                                                                        </a>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="border-t pt-2">
                                                            <p className="text-xs text-muted-foreground">Or fill in manually below</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                                                        <Input
                                                            placeholder="Jane Smith"
                                                            value={editContact.name}
                                                            onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground">Email *</label>
                                                        <Input
                                                            type="email"
                                                            placeholder="jane@brand.com"
                                                            value={editContact.email}
                                                            onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                                                            className="h-8 text-sm"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground">Phone</label>
                                                        <Input
                                                            placeholder="+44 7700 900000"
                                                            value={editContact.phone}
                                                            onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground">Website</label>
                                                        <Input
                                                            placeholder="https://brand.com"
                                                            value={editContact.website}
                                                            onChange={(e) => setEditContact({ ...editContact, website: e.target.value })}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <Button variant="outline" size="sm" onClick={() => setIsEditingContact(false)}>Cancel</Button>
                                                    <Button size="sm" onClick={() => updateBrandContact(selectedBrand.id, editContact)}>Save</Button>
                                                </div>
                                            </div>
                                        ) : (selectedBrand.contactName || selectedBrand.contactEmail || selectedBrand.contactPhone || selectedBrand.website) ? (
                                            <div className="space-y-3">
                                                {selectedBrand.contactName && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{selectedBrand.contactName}</p>
                                                            {selectedBrand.contactTitle && (
                                                                <p className="text-xs text-muted-foreground">{selectedBrand.contactTitle}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedBrand.contactEmail && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <a href={`mailto:${selectedBrand.contactEmail}`} className="text-brand hover:underline text-sm">
                                                            {selectedBrand.contactEmail}
                                                        </a>
                                                    </div>
                                                )}
                                                {selectedBrand.contactPhone && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <span>{selectedBrand.contactPhone}</span>
                                                    </div>
                                                )}
                                                {selectedBrand.website && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <a href={selectedBrand.website} target="_blank" rel="noopener noreferrer"
                                                            className="text-brand hover:underline flex items-center gap-1 text-sm truncate">
                                                            {selectedBrand.website.replace(/^https?:\/\//, "")}
                                                            <ExternalLink className="h-3 w-3 shrink-0" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic text-center py-2">No contact info yet — click "Add Contact" to add an email.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Pipeline Stage Selector */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Stage</h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {PIPELINE_STAGES.map((stage) => (
                                                <button
                                                    key={stage.id}
                                                    onClick={() => {
                                                        updateBrandStage(selectedBrand.id, stage.id);
                                                        setSelectedBrand({ ...selectedBrand, pipelineStage: stage.id });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedBrand.pipelineStage === stage.id
                                                        ? "bg-brand text-white shadow-sm scale-105"
                                                        : `${stage.color} hover:opacity-80`
                                                        }`}
                                                >
                                                    {stage.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-4 w-4 text-brand" />
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Action</h3>
                                        </div>
                                        <p className="text-sm">
                                            {selectedBrand.nextAction || <span className="text-muted-foreground italic">Not set</span>}
                                        </p>
                                    </div>
                                    <div className="border rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-amber-500" />
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Follow-up</h3>
                                        </div>
                                        <p className="text-sm">
                                            {selectedBrand.nextFollowUp
                                                ? new Date(selectedBrand.nextFollowUp).toLocaleDateString("en-GB", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })
                                                : <span className="text-muted-foreground italic">Not set</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b flex justify-between items-center">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5" /> Notes
                                        </h3>
                                        {!isEditingNotes && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-brand gap-1"
                                                onClick={() => {
                                                    setEditNotesValue(selectedBrand.notes || "");
                                                    setIsEditingNotes(true);
                                                }}
                                            >
                                                {selectedBrand.notes ? "Edit" : "Add Notes"}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {isEditingNotes ? (
                                            <div className="space-y-3">
                                                <Textarea
                                                    autoFocus
                                                    rows={4}
                                                    placeholder="Add notes about this brand..."
                                                    value={editNotesValue}
                                                    onChange={(e) => setEditNotesValue(e.target.value)}
                                                    className="resize-none border-zinc-200"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={() => updateBrandNotes(selectedBrand.id, editNotesValue)}>
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : selectedBrand.notes ? (
                                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                {selectedBrand.notes}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic text-center py-2">
                                                No notes added yet.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Campaigns */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Megaphone className="h-3.5 w-3.5" /> Campaigns ({selectedBrand._count?.campaigns || 0})
                                        </h3>
                                        <Link href={`/campaigns?brandId=${selectedBrand.id}`}>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-brand gap-1">
                                                <Plus className="h-3 w-3" /> New
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="p-4">
                                        {selectedBrand.campaigns && selectedBrand.campaigns.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedBrand.campaigns.map((c) => (
                                                    <Link
                                                        key={c.id}
                                                        href="/campaigns"
                                                        className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent/50 transition-colors"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium">{c.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {c.fee ? `£${c.fee.toLocaleString()}` : "No fee set"}
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs">{c.status}</Badge>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-3">
                                                No campaigns yet
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Tags */}
                                {selectedBrand.tags && selectedBrand.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                            <Tag className="h-3.5 w-3.5" /> Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedBrand.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-1 rounded-full">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activity Timeline */}
                                {selectedBrand.activities && selectedBrand.activities.length > 0 && (
                                    <div className="border rounded-xl overflow-hidden">
                                        <div className="px-4 py-2.5 bg-muted/30 border-b">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <MessageSquare className="h-3.5 w-3.5" /> Activity
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <div className="space-y-0">
                                                {selectedBrand.activities.map((activity, i) => (
                                                    <div key={activity.id} className="flex gap-3 relative">
                                                        <div className="flex flex-col items-center">
                                                            <div className="h-2.5 w-2.5 rounded-full bg-brand mt-1.5 shrink-0 ring-4 ring-background z-10" />
                                                            {i < selectedBrand.activities!.length - 1 && (
                                                                <div className="w-px flex-1 bg-border" />
                                                            )}
                                                        </div>
                                                        <div className="pb-4 min-w-0">
                                                            <p className="text-sm leading-snug">{activity.description}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {timeAgo(activity.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        className="flex-1 bg-brand hover:bg-brand/90 text-white gap-2 h-11"
                                        onClick={() => startOutreach(selectedBrand, "pitch")}
                                        disabled={creatingOutreach}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        {creatingOutreach ? "Creating..." : "Generate Pitch"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2 h-11 border-brand/30 text-brand hover:bg-brand/5"
                                        onClick={() => startOutreach(selectedBrand, "email")}
                                        disabled={creatingOutreach}
                                    >
                                        <Mail className="h-4 w-4" />
                                        {creatingOutreach ? "Creating..." : "Send Email"}
                                    </Button>
                                </div>

                                {/* Delete Brand */}
                                <div className="border-t pt-4 mt-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full gap-2 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteBrand(selectedBrand.id)}
                                        disabled={deleting}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {deleting ? "Deleting..." : "Delete Brand"}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
