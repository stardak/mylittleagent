"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
    Bot,
    Wrench,
    History,
    PenLine,
    MessagesSquare,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────── */
/*  AI Outreach Prompts                                            */
/* ─────────────────────────────────────────────────────────────── */
const OUTREACH_PROMPTS = [
    {
        category: "🎯 Strategy",
        color: "bg-violet-50 border-violet-200 hover:bg-violet-100",
        prompts: [
            { title: "Help me find brand targets", message: "I want to pitch brands but I'm not sure which ones to approach. Based on my profile, content categories, and audience, can you suggest types of brands I should be targeting and why they'd be a good fit?" },
            { title: "Is this brand a good fit?", message: "I'm thinking of pitching a brand — can you help me assess whether they're a good fit for my audience and content? I'll tell you about them." },
            { title: "What should my pitch angle be?", message: "I have a brand in mind that I want to pitch. Can you help me figure out the best angle and hook for my outreach? I'll share the details." },
        ],
    },
    {
        category: "✉️ Outreach Help",
        color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
        prompts: [
            { title: "Review my pitch email", message: "Can you review and improve my outreach email to a brand? I'll paste it in — please check the tone, value proposition, and call to action." },
            { title: "I haven't heard back — what next?", message: "I sent a pitch email to a brand about a week ago and haven't heard back. Can you help me write a follow-up that's friendly but firm, and adds new value?" },
            { title: "They replied — help me respond", message: "A brand replied to my pitch email and I need help crafting the best response. I'll share what they said." },
        ],
    },
    {
        category: "🤝 Negotiation",
        color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
        prompts: [
            { title: "They offered less than my rate", message: "A brand has come back with a lower offer than my rate. Can you help me write a confident counter-offer that doesn't burn the relationship? I'll share the numbers." },
            { title: "What rate should I charge?", message: "I have an opportunity with a brand and I'm not sure what to charge. Can you help me think through my pricing based on my stats and what the deliverables involve?" },
            { title: "Help me write a proposal", message: "I'm ready to send a formal proposal to a brand. Can you help me structure a compelling pitch proposal with deliverables, timeline, and pricing?" },
            { title: "They want exclusivity — should I agree?", message: "A brand is asking for exclusivity in their deal. Can you help me understand the implications and how to negotiate fair terms or compensation?" },
        ],
    },
];

/* ─────────────────────────────────────────────────────────────── */
/*  AI chat hook                                                   */
/* ─────────────────────────────────────────────────────────────── */
type OutreachChatMessage = { id: string; role: "user" | "assistant"; content: string };

function useOutreachChat() {
    const [messages, setMessages] = useState<OutreachChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [chatStatus, setChatStatus] = useState<"ready" | "streaming" | "acting">("ready");
    const abortRef = useRef<AbortController | null>(null);

    const sendOutreachMessage = useCallback(async (text: string) => {
        const userMsg: OutreachChatMessage = { id: `user-${Date.now()}`, role: "user", content: text };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setChatStatus("streaming");
        const aId = `asst-${Date.now()}`;
        setMessages((prev) => [...prev, { id: aId, role: "assistant", content: "" }]);
        try {
            abortRef.current = new AbortController();
            const res = await fetch("/api/agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: updated.map((m) => ({ role: m.role, content: m.content })), conversationId }),
                signal: abortRef.current.signal,
            });
            const cid = res.headers.get("x-conversation-id");
            if (cid) setConversationId(cid);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Something went wrong" }));
                setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: `⚠️ ${err.error}` } : m));
                setChatStatus("ready"); return;
            }
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let full = "";
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    full += decoder.decode(value, { stream: true });
                    const captured = full;
                    setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: captured } : m));
                    setChatStatus(full.length > 0 ? "streaming" : "acting");
                }
            }
        } catch (err: unknown) {
            if ((err as Error)?.name !== "AbortError") {
                setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: "⚠️ Failed to get response." } : m));
            }
        } finally { setChatStatus("ready"); }
    }, [messages, conversationId]);

    const resetChat = useCallback(() => { abortRef.current?.abort(); setMessages([]); setConversationId(null); setChatStatus("ready"); }, []);
    return { chatMessages: messages, sendOutreachMessage, chatStatus, resetChat };
}

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
    autoSendFollowUp: boolean;
    gmailThreadId: string | null;
    includeMediaCard: boolean;
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
    return (
        <Suspense>
            <OutreachPageInner />
        </Suspense>
    );
}

function OutreachPageInner() {
    const searchParams = useSearchParams();
    const autoOpenId = searchParams.get("open");
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

    // Media card PDF state
    const [mediaPdfUrl, setMediaPdfUrl] = useState<string | null>(null);
    const [includeMediaCardPdf, setIncludeMediaCardPdf] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const pdfFileRef = useRef<HTMLInputElement>(null);

    // AI chat state
    const { chatMessages, sendOutreachMessage, chatStatus, resetChat } = useOutreachChat();
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [aiInput, setAiInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const aiInputRef = useRef<HTMLTextAreaElement>(null);
    const isChatBusy = chatStatus === "streaming" || chatStatus === "acting";

    // Conversation history state
    type ConvSummary = { id: string; title: string | null; updatedAt: string; _count: { messages: number } };
    const [showHistory, setShowHistory] = useState(false);
    const [conversations, setConversations] = useState<ConvSummary[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);

    const loadConversations = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) setConversations(await res.json());
        } catch { /* silent */ } finally { setHistoryLoading(false); }
    }, []);

    const resumeConversation = async (convId: string) => {
        try {
            const res = await fetch(`/api/conversations/${convId}`);
            if (!res.ok) return;
            const data = await res.json();
            resetChat();
            // Re-hydrate messages into the chat hook via a synthetic approach
            // We'll pass them as initial messages by rebuilding state manually
            const msgs: OutreachChatMessage[] = data.messages.map((m: { id: string; role: string; content: string }) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
            }));
            // Use the hook's internal setter via a workaround: fire a special re-init
            // Instead, we just push all messages via a trick — call the send function
            // Actually simplest: store loaded messages in local state and render them
            setLoadedMessages(msgs);
            setActiveConvId(convId);
            setShowHistory(false);
        } catch { toast.error("Couldn\'t load conversation"); }
    };

    const [loadedMessages, setLoadedMessages] = useState<OutreachChatMessage[]>([]);
    const displayMessages = loadedMessages.length > 0 && activeConvId ? loadedMessages : chatMessages;

    // AI generation states
    const [generatingEmails, setGeneratingEmails] = useState(false);
    const [generatingProposal, setGeneratingProposal] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<1 | 2 | null>(null);
    const [syncingReplies, setSyncingReplies] = useState(false);

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
        fetch("/api/media-card")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => { if (d?.slug) setWorkspaceSlug(d.slug); })
            .catch(() => { });
    }, [fetchOutreaches]);

    // Auto-open outreach from ?open= param (navigated from Pipeline)
    useEffect(() => {
        if (!autoOpenId || loading) return;
        const target = outreaches.find((o) => o.id === autoOpenId);
        if (target) {
            openDetail(target);
        } else if (!loading && outreaches.length === 0) {
            // Fallback: fetch directly
            fetch(`/api/outreach/${autoOpenId}`)
                .then((r) => r.ok ? r.json() : null)
                .then((data) => { if (data) { setSelected(data); setShowDetail(true); } })
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoOpenId, loading, outreaches]);

    // Auto-scroll chat
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
    useEffect(() => { if (aiPanelOpen) setTimeout(() => aiInputRef.current?.focus(), 200); }, [aiPanelOpen]);

    const handleAiSend = () => {
        const t = aiInput.trim();
        if (!t || isChatBusy) return;
        setAiInput("");
        sendOutreachMessage(t);
    };

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

    const sendViaGmail = async (emailNumber: 1 | 2) => {
        if (!selected) return;
        setSendingEmail(emailNumber);
        try {
            const res = await fetch(`/api/outreach/${selected.id}/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailNumber,
                    includeMediaCard: emailNumber === 1 && includeMediaCardPdf && !!mediaPdfUrl,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSelected({ ...selected, ...data.outreach });
                setOutreaches((prev) => prev.map((o) => o.id === selected.id ? { ...o, ...data.outreach } : o));
                const withPdf = emailNumber === 1 && includeMediaCardPdf && !!mediaPdfUrl ? " (with media card PDF)" : "";
                toast.success(`Email ${emailNumber} sent via Gmail!`, { description: `Delivered to ${selected.contactEmail}${withPdf}` });
            } else {
                toast.error("Failed to send", { description: data.error });
            }
        } catch {
            toast.error("Failed to send email");
        } finally { setSendingEmail(null); }
    };

    const uploadMediaCardPdf = async (file: File) => {
        setUploadingPdf(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/media-card/upload-pdf", { method: "POST", body: fd });
            const data = await res.json();
            if (res.ok) {
                setMediaPdfUrl(data.url);
                setIncludeMediaCardPdf(true);
                toast.success("PDF uploaded", { description: "It will be attached to Email 1 when you send." });
            } else {
                toast.error("Upload failed", { description: data.error });
            }
        } catch {
            toast.error("Upload failed");
        } finally { setUploadingPdf(false); }
    };

    const syncReplies = async () => {
        setSyncingReplies(true);
        try {
            const res = await fetch("/api/gmail/sync", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                if (data.repliesFound > 0) {
                    toast.success(`${data.repliesFound} new repl${data.repliesFound === 1 ? "y" : "ies"} detected!`, { description: "Status updated to Replied." });
                    fetchOutreaches();
                } else {
                    toast.info("No new replies found", { description: `Checked ${data.checked} outreach thread${data.checked === 1 ? "" : "s"}.` });
                }
            } else {
                toast.error("Sync failed", { description: data.error });
            }
        } catch {
            toast.error("Reply sync failed");
        } finally { setSyncingReplies(false); }
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
                <div>
                    <h1 className="text-3xl font-heading font-semibold">Brand Outreach</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {outreaches.length} deal{outreaches.length !== 1 ? "s" : ""} in pipeline
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={syncReplies}
                        disabled={syncingReplies}
                    >
                        {syncingReplies ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareReply className="h-3.5 w-3.5" />}
                        Sync Replies
                    </Button>
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
            </div>

            {/* Search + Filter Bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search brands..."
                        className="pl-9 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {OUTREACH_STATUSES.map((s) => {
                        const count = s.id === "all" ? outreaches.length : (statusCounts[s.id] || 0);
                        const isActive = filterStatus === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setFilterStatus(s.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                                    ? "bg-brand text-white shadow-sm"
                                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                {s.label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-semibold ${isActive ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── AI Assistant Panel ──────────────────────────────── */}
            {
                aiPanelOpen ? (
                    <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-brand" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">AI Outreach Assistant</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isChatBusy ? "Thinking..." : activeConvId ? "Resumed conversation" : "Ask me anything about brand outreach"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* New Chat */}
                                <button
                                    onClick={() => { resetChat(); setLoadedMessages([]); setActiveConvId(null); setShowHistory(false); }}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                    title="New chat"
                                >
                                    <PenLine className="h-4 w-4 text-muted-foreground" />
                                </button>
                                {/* History toggle */}
                                <button
                                    onClick={() => { setShowHistory((v) => !v); if (!showHistory) loadConversations(); }}
                                    className={`p-1.5 rounded-lg transition-colors ${showHistory ? "bg-brand/10 text-brand" : "hover:bg-muted text-muted-foreground"}`}
                                    title="Conversation history"
                                >
                                    <History className="h-4 w-4" />
                                </button>
                                <button onClick={() => setAiPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* History Panel */}
                        {showHistory && (
                            <div className="border-b bg-muted/20 max-h-[260px] overflow-y-auto">
                                <div className="px-4 py-2.5 flex items-center justify-between sticky top-0 bg-muted/30 backdrop-blur border-b">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                        <MessagesSquare className="h-3.5 w-3.5" /> Previous Threads
                                    </p>
                                    {historyLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                                </div>
                                {conversations.length === 0 && !historyLoading ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No saved conversations yet</p>
                                ) : (
                                    <div className="divide-y">
                                        {conversations.map((conv) => (
                                            <button
                                                key={conv.id}
                                                onClick={() => resumeConversation(conv.id)}
                                                className={`w-full text-left px-4 py-3 hover:bg-brand/5 transition-colors group ${activeConvId === conv.id ? "bg-brand/5 border-l-2 border-brand" : ""}`}
                                            >
                                                <p className="text-sm font-medium truncate group-hover:text-brand transition-colors">
                                                    {conv.title || "Untitled conversation"}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {conv._count.messages} message{conv._count.messages !== 1 ? "s" : ""} · {new Date(conv.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Messages */}
                        <div className="min-h-[140px] max-h-[380px] overflow-y-auto p-5 space-y-4">
                            {displayMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-24 text-center">
                                    <Sparkles className="h-6 w-6 text-brand/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">Ask anything, or pick a prompt below.</p>
                                </div>
                            ) : displayMessages.map((m) => (
                                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                    {m.role === "assistant" && (
                                        <div className="h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="h-4 w-4 text-brand" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-brand text-white rounded-br-md" : "bg-muted rounded-bl-md"
                                        }`}>
                                        {m.content || (
                                            <span className="flex items-center gap-2">
                                                {chatStatus === "acting"
                                                    ? <><Wrench className="h-3.5 w-3.5 text-brand animate-spin" /><span className="text-xs text-muted-foreground">Working...</span></>
                                                    : <><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} /></>}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        {/* Quick prompts inside expanded panel */}
                        {displayMessages.length === 0 && (
                            <div className="border-t px-5 py-4 bg-muted/20">
                                <div className="flex flex-wrap gap-2">
                                    {OUTREACH_PROMPTS.flatMap((cat) => cat.prompts).slice(0, 6).map((p) => (
                                        <button
                                            key={p.title}
                                            onClick={() => sendOutreachMessage(p.message)}
                                            disabled={isChatBusy}
                                            className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-brand/5 hover:border-brand/30 hover:text-brand transition-all disabled:opacity-50 font-medium"
                                        >
                                            {p.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="border-t p-4 bg-background">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    ref={aiInputRef}
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
                                    placeholder="Ask about strategy, rates, negotiation..."
                                    disabled={isChatBusy}
                                    rows={1}
                                    className="flex-1 text-sm resize-none min-h-[44px] max-h-[120px] border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-50"
                                />
                                <Button onClick={handleAiSend} size="icon" disabled={isChatBusy || !aiInput.trim()} className="bg-brand hover:bg-brand/90 text-white shrink-0 h-10 w-10">
                                    {isChatBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setAiPanelOpen(true)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 border rounded-xl bg-gradient-to-r from-brand/5 to-transparent hover:from-brand/10 transition-all group text-left"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">AI Outreach Assistant</p>
                            <p className="text-xs text-muted-foreground">Strategy · Email review · Negotiation · Rate advice</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            {["Find targets", "Review email", "Counter-offer"].map((label) => (
                                <span key={label} className="hidden sm:inline-flex text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{label}</span>
                            ))}
                            <Sparkles className="h-4 w-4 text-brand/50 group-hover:text-brand transition-colors" />
                        </div>
                    </button>
                )
            }

            {/* Outreach List */}
            {
                loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : outreaches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                            <Send className="h-8 w-8 text-brand" />
                        </div>
                        <h3 className="text-lg font-heading font-semibold">No outreach yet</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                            Start pitching brands you want to work with.
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {outreaches.map((outreach) => {
                            const initials = outreach.brandName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                            return (
                                <button
                                    key={outreach.id}
                                    onClick={() => openDetail(outreach)}
                                    className="group text-left border rounded-2xl p-4 bg-card hover:shadow-md hover:border-brand/30 transition-all duration-200 flex flex-col gap-3"
                                >
                                    {/* Card top row */}
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center shrink-0 text-sm font-bold text-brand">
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm leading-tight truncate group-hover:text-brand transition-colors">{outreach.brandName}</p>
                                            {outreach.brandIndustry && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{outreach.brandIndustry}</p>
                                            )}
                                        </div>
                                        <Badge className={`text-[10px] shrink-0 ${statusColor(outreach.status)}`}>
                                            {statusLabel(outreach.status)}
                                        </Badge>
                                    </div>

                                    {/* Product */}
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 bg-muted/40 rounded-lg px-3 py-2">
                                        {outreach.product}
                                    </p>

                                    {/* Footer row */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground truncate max-w-[60%]">{outreach.contactEmail}</p>
                                        <span className="text-[10px] text-muted-foreground/70">{timeAgo(outreach.updatedAt)}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )
            }

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
                                                {selected.product ? (
                                                    <p
                                                        className="text-sm font-medium cursor-pointer hover:text-brand transition-colors"
                                                        title="Click to edit"
                                                        onClick={() => {
                                                            const val = prompt("What product or service do you want to promote?", selected.product);
                                                            if (val !== null && val.trim()) {
                                                                updateOutreach(selected.id, { product: val.trim() });
                                                            }
                                                        }}
                                                    >
                                                        {selected.product}
                                                    </p>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            const val = prompt("What product or service do you want to promote? (required for email generation)", "");
                                                            if (val !== null && val.trim()) {
                                                                updateOutreach(selected.id, { product: val.trim() });
                                                            }
                                                        }}
                                                        className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:underline"
                                                    >
                                                        <span>⚠ Add product / service</span>
                                                    </button>
                                                )}
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
                                            <div className="text-center py-4 space-y-3">
                                                {!selected.product && (
                                                    <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg px-3 py-2 flex items-center gap-2">
                                                        <span>⚠</span>
                                                        <span>Add a <strong>product / service</strong> in the brief above before generating</span>
                                                    </div>
                                                )}
                                                <p className="text-sm text-muted-foreground">Generate a personalised outreach email using AI</p>
                                                <Button
                                                    onClick={!selected.product ? () => toast.warning("Add a product / service first", { description: "Click '⚠ Add product / service' in the Brand Brief section above." }) : generateEmails}
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
                                                        <>
                                                            {/* Media Card PDF attach row */}
                                                            <div className="w-full flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 mt-1">
                                                                <input
                                                                    ref={pdfFileRef}
                                                                    type="file"
                                                                    accept="application/pdf"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) uploadMediaCardPdf(file);
                                                                        e.target.value = "";
                                                                    }}
                                                                />
                                                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                {mediaPdfUrl ? (
                                                                    <>
                                                                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={includeMediaCardPdf}
                                                                                onChange={(e) => setIncludeMediaCardPdf(e.target.checked)}
                                                                                className="h-3.5 w-3.5 accent-brand"
                                                                            />
                                                                            <span className="text-xs text-foreground">Attach media card PDF</span>
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => pdfFileRef.current?.click()}
                                                                            className="text-[10px] text-muted-foreground hover:text-foreground underline"
                                                                        >
                                                                            Replace
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        disabled={uploadingPdf}
                                                                        onClick={() => pdfFileRef.current?.click()}
                                                                        className="text-xs text-brand hover:text-brand/80 flex items-center gap-1.5 disabled:opacity-50"
                                                                    >
                                                                        {uploadingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                                                                        Upload & attach media card PDF
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                                                onClick={() => sendViaGmail(1)}
                                                                disabled={sendingEmail !== null}
                                                            >
                                                                {sendingEmail === 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                                                                Send via Gmail
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                                                                onClick={markEmail1Sent}
                                                            >
                                                                <Send className="h-3.5 w-3.5 mr-1" /> Mark as Sent
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Email 2 — Follow-Up */}
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Email 2 — Follow-Up (7 days)
                                            </h3>
                                        </div>
                                        {selected.email2SentAt && (
                                            <Badge className="bg-green-50 text-green-700 text-[10px]">
                                                Sent {formatDate(selected.email2SentAt)}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {/* Auto-send toggle — always shown until email is sent */}
                                        {!selected.email2SentAt && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!selected) return;
                                                    const next = !selected.autoSendFollowUp;
                                                    setSelected({ ...selected, autoSendFollowUp: next });
                                                    await updateOutreach(selected.id, { autoSendFollowUp: next });
                                                    if (next) {
                                                        toast.success("Auto-send enabled", {
                                                            description: selected.email2DueAt
                                                                ? `Follow-up will be sent automatically on ${formatDate(selected.email2DueAt)}`
                                                                : "Follow-up will be sent 7 days after Email 1 is sent.",
                                                        });
                                                    } else {
                                                        toast.info("Auto-send disabled", { description: "Send the follow-up manually when you're ready." });
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between rounded-lg px-4 py-3 border transition-colors ${selected.autoSendFollowUp
                                                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                                    : "bg-muted/40 border-border hover:bg-muted/60"
                                                    }`}
                                            >
                                                <div className="text-left">
                                                    <p className={`text-sm font-semibold ${selected.autoSendFollowUp ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
                                                        Auto-send follow-up
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {selected.autoSendFollowUp
                                                            ? selected.email2DueAt
                                                                ? `Scheduled for ${formatDate(selected.email2DueAt)}`
                                                                : "Will send 7 days after Email 1"
                                                            : "Send 7 days after Email 1 automatically via Gmail"}
                                                    </p>
                                                </div>
                                                {/* Toggle pill */}
                                                <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${selected.autoSendFollowUp ? "bg-green-500" : "bg-muted-foreground/30"
                                                    }`}>
                                                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${selected.autoSendFollowUp ? "translate-x-6" : "translate-x-1"
                                                        }`} />
                                                </span>
                                            </button>
                                        )}

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
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                                                onClick={() => sendViaGmail(2)}
                                                                disabled={sendingEmail !== null}
                                                            >
                                                                {sendingEmail === 2 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                                                                Send via Gmail
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-amber-600 hover:bg-amber-700 text-white ml-auto"
                                                                onClick={markEmail2Sent}
                                                            >
                                                                <Send className="h-3.5 w-3.5 mr-1" /> Mark as Sent
                                                            </Button>
                                                        </>
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
