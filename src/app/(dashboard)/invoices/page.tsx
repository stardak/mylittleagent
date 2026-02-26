"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Bot,
    Send,
    Plus,
    Loader2,
    FileText,
    ChevronDown,
    Sparkles,
    Trash2,
    Copy,
    Check,
    Wrench,
    X,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────── */
/*  Types                                                          */
/* ─────────────────────────────────────────────────────────────── */

type LineItem = {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

type Invoice = {
    id: string;
    invoiceNumber: string;
    clientName: string | null;
    issueDate: string;
    dueDate: string;
    lineItems: LineItem[];
    subtotal: number;
    vatRate: number | null;
    vatAmount: number | null;
    total: number;
    currency: string;
    status: string;
    notes: string | null;
    campaign?: { name: string; brand: { name: string } } | null;
};

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

/* ─────────────────────────────────────────────────────────────── */
/*  Status config                                                  */
/* ─────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
    submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200" },
    settled: { label: "Settled", className: "bg-green-50 text-green-700 border-green-200" },
    overdue: { label: "Overdue", className: "bg-red-50 text-red-700 border-red-200" },
    cancelled: { label: "Cancelled", className: "bg-zinc-50 text-zinc-400 border-zinc-200 line-through" },
};

const STATUS_ORDER = ["draft", "submitted", "settled", "overdue", "cancelled"];

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

/* ─────────────────────────────────────────────────────────────── */
/*  AI chat hook                                                   */
/* ─────────────────────────────────────────────────────────────── */

function useInvoiceChat(onInvoiceCreated: (inv: Invoice) => void) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [status, setStatus] = useState<"ready" | "streaming" | "acting">("ready");
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(
        async (text: string, extraContext?: string) => {
            // Build the system note that teaches the AI how to create invoices
            const systemNote = extraContext || "";

            const userMsg: ChatMessage = {
                id: `user-${Date.now()}`,
                role: "user",
                content: text,
            };
            const updatedMessages = [...messages, userMsg];
            setMessages(updatedMessages);
            setStatus("streaming");

            const assistantId = `asst-${Date.now()}`;
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

            try {
                abortRef.current = new AbortController();
                const res = await fetch("/api/agent/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                        conversationId,
                        systemExtra: systemNote,
                    }),
                    signal: abortRef.current.signal,
                });

                const cid = res.headers.get("x-conversation-id");
                if (cid) setConversationId(cid);

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: "Something went wrong" }));
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId ? { ...m, content: `⚠️ ${err.error || "Something went wrong"}` } : m
                        )
                    );
                    setStatus("ready");
                    return;
                }

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let fullText = "";
                let hasStartedText = false;

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        fullText += chunk;

                        if (!hasStartedText && fullText.length === 0) {
                            setStatus("acting");
                        } else {
                            hasStartedText = true;
                            setStatus("streaming");
                        }

                        const captured = fullText;
                        setMessages((prev) =>
                            prev.map((m) => (m.id === assistantId ? { ...m, content: captured } : m))
                        );
                    }
                }

                // Detect if the AI produced structured invoice JSON in its response
                detectAndSaveInvoice(fullText, onInvoiceCreated);
            } catch (err: unknown) {
                if ((err as Error)?.name !== "AbortError") {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId
                                ? { ...m, content: "⚠️ Failed to get response. Please try again." }
                                : m
                        )
                    );
                }
            } finally {
                setStatus("ready");
            }
        },
        [messages, conversationId, onInvoiceCreated]
    );

    const reset = useCallback(() => {
        abortRef.current?.abort();
        setMessages([]);
        setConversationId(null);
        setStatus("ready");
    }, []);

    return { messages, sendMessage, status, reset, setMessages };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Detect AI invoice JSON and save it                            */
/* ─────────────────────────────────────────────────────────────── */

async function detectAndSaveInvoice(text: string, onCreated: (inv: Invoice) => void) {
    // Look for JSON block with invoice structure
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) ||
        text.match(/\{[\s\S]*?"invoiceNumber"[\s\S]*?"lineItems"[\s\S]*?"total"[\s\S]*?\}/);
    if (!match) return;

    try {
        const raw = match[1] || match[0];
        const data = JSON.parse(raw);
        if (!data.invoiceNumber || !data.lineItems || data.total === undefined) return;

        const res = await fetch("/api/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            const invoice = await res.json();
            onCreated(invoice);
            toast.success("Invoice saved!", { description: `#${invoice.invoiceNumber} added to your invoices.` });
        }
    } catch {
        // Silently ignore parse errors — the AI response may not always have valid JSON
    }
}

/* ─────────────────────────────────────────────────────────────── */
/*  Copy button                                                    */
/* ─────────────────────────────────────────────────────────────── */

function CopyBtn({ text }: { text: string }) {
    const [done, setDone] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); }}
            className="p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
            title="Copy"
        >
            {done ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Invoice card                                                   */
/* ─────────────────────────────────────────────────────────────── */

function InvoiceCard({ invoice, onStatusChange, onDelete }: {
    invoice: Invoice;
    onStatusChange: (id: string, status: string) => void;
    onDelete: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);

    const clientLabel = invoice.campaign?.brand.name || invoice.clientName || "Unknown client";
    const campaignLabel = invoice.campaign?.name;
    const currencySymbol = invoice.currency === "GBP" ? "£" : invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "€" : invoice.currency;
    const isOverdue = invoice.status === "submitted" && new Date(invoice.dueDate) < new Date();

    const handleStatusChange = async (newStatus: string) => {
        setChangingStatus(true);
        await onStatusChange(invoice.id, newStatus);
        setChangingStatus(false);
    };

    return (
        <div className="border rounded-2xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Card header */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-brand" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">#{invoice.invoiceNumber}</span>
                            <StatusBadge status={isOverdue ? "overdue" : invoice.status} />
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {clientLabel}{campaignLabel ? ` · ${campaignLabel}` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                        <p className="font-bold text-base">{currencySymbol}{invoice.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Due {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                </div>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t px-5 py-4 space-y-4 bg-muted/20">
                    {/* Line items */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Line Items</p>
                        <div className="space-y-1.5">
                            {(invoice.lineItems as LineItem[]).map((item, i) => (
                                <div key={i} className="flex justify-between text-sm gap-4">
                                    <span className="text-foreground/80 flex-1">{item.description}</span>
                                    <span className="text-muted-foreground shrink-0">{item.quantity} × {currencySymbol}{Number(item.unitPrice).toFixed(2)}</span>
                                    <span className="font-medium shrink-0">{currencySymbol}{Number(item.total).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t mt-3 pt-3 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                            </div>
                            {invoice.vatAmount != null && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">VAT {invoice.vatRate ? `(${invoice.vatRate}%)` : ""}</span>
                                    <span>{currencySymbol}{invoice.vatAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-base pt-1 border-t mt-1">
                                <span>Total</span>
                                <span>{currencySymbol}{invoice.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="bg-background rounded-lg p-3 border text-sm text-muted-foreground">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Notes</p>
                            {invoice.notes}
                        </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Status changer */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Change status:</span>
                            {STATUS_ORDER.filter((s) => s !== invoice.status).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    disabled={changingStatus}
                                    className="text-xs px-2.5 py-1 rounded-full border hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                    {changingStatus ? <Loader2 className="h-3 w-3 animate-spin inline" /> : STATUS_CONFIG[s]?.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => onDelete(invoice.id)}
                            className="text-xs text-destructive hover:text-destructive/80 gap-1 flex items-center transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Main page                                                     */
/* ─────────────────────────────────────────────────────────────── */

const INVOICE_SYSTEM_PROMPT = `When helping the user create an invoice, gather: client/brand name, what services were provided (line items with descriptions, quantities, and unit prices), payment due date, and whether VAT applies.

Once you have all the details, produce the invoice as a JSON code block in this exact format:

\`\`\`json
{
  "clientName": "Brand Name",
  "invoiceNumber": "INV-001",
  "issueDate": "2026-02-26",
  "dueDate": "2026-03-26",
  "lineItems": [
    { "description": "Instagram Reel (x2)", "quantity": 2, "unitPrice": 500, "total": 1000 }
  ],
  "subtotal": 1000,
  "vatRate": 20,
  "vatAmount": 200,
  "total": 1200,
  "currency": "GBP",
  "notes": "Payment via bank transfer. Details on file."
}
\`\`\`

Always include the JSON code block at the END of your response after confirming the details with the user. Auto-generate a sensible sequential invoice number like INV-001.`;

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiOpen, setAiOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleInvoiceCreated = useCallback((inv: Invoice) => {
        setInvoices((prev) => [inv, ...prev]);
    }, []);

    const { messages, sendMessage, status, reset, setMessages } = useInvoiceChat(handleInvoiceCreated);
    const isBusy = status === "streaming" || status === "acting";
    const isActing = status === "acting";

    useEffect(() => {
        fetch("/api/invoices")
            .then((r) => r.json())
            .then((data) => { setInvoices(data); setLoading(false); })
            .catch(() => setLoading(false));

        fetch("/api/settings/api-key")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => setHasApiKey(d?.hasKey ?? false))
            .catch(() => setHasApiKey(false));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (aiOpen) setTimeout(() => inputRef.current?.focus(), 200);
    }, [aiOpen]);

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || isBusy) return;
        setInputValue("");
        sendMessage(text, INVOICE_SYSTEM_PROMPT);
    };

    const openAI = () => {
        reset();
        setAiOpen(true);
        // Prime the conversation with a helpful opening message
        setMessages([{
            id: "welcome",
            role: "assistant",
            content: "Hi! I'll help you create an invoice. Who is this invoice for, and what services did you provide?",
        }]);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const res = await fetch(`/api/invoices/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            const updated = await res.json();
            setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
            toast.success(`Invoice marked as ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`);
        }
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/invoices/${id}`, { method: "DELETE" });
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        toast.success("Invoice deleted");
    };

    const filtered = filterStatus === "all"
        ? invoices
        : invoices.filter((inv) => {
            const effectiveStatus = inv.status === "submitted" && new Date(inv.dueDate) < new Date() ? "overdue" : inv.status;
            return effectiveStatus === filterStatus;
        });

    const totals = {
        all: invoices.length,
        draft: invoices.filter((i) => i.status === "draft").length,
        submitted: invoices.filter((i) => i.status === "submitted" && new Date(i.dueDate) >= new Date()).length,
        settled: invoices.filter((i) => i.status === "settled").length,
        overdue: invoices.filter((i) => i.status === "submitted" && new Date(i.dueDate) < new Date()).length,
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-semibold">Invoices</h1>
                    <p className="text-muted-foreground mt-1">Create, track, and manage your invoices.</p>
                </div>
                <Button
                    onClick={openAI}
                    className="bg-brand hover:bg-brand/90 text-white gap-2 shrink-0"
                    disabled={hasApiKey === false}
                    title={hasApiKey === false ? "Add an API key in Settings → AI to use this feature" : undefined}
                >
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                </Button>
            </div>

            {/* ── AI panel ───────────────────────────────────────────── */}
            {aiOpen && (
                <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
                    {/* AI header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-brand" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">AI Invoice Generator</p>
                                <p className="text-xs text-muted-foreground">
                                    {isBusy
                                        ? isActing ? "Working on it..." : "Thinking..."
                                        : "I'll guide you through creating an invoice"}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setAiOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="min-h-[160px] max-h-[400px] overflow-y-auto p-5 space-y-4">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                                {message.role === "assistant" && (
                                    <div className="h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="h-4 w-4 text-brand" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-brand text-white rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                                    {message.content ? (
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {/* Hide the raw JSON from the user — show a nice summary instead */}
                                            {message.role === "assistant" && message.content.includes("```json") ? (
                                                <>
                                                    <p>{message.content.split("```json")[0].trim()}</p>
                                                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 font-medium">
                                                        <Check className="h-3.5 w-3.5" />
                                                        Invoice generated and saved below ↓
                                                    </div>
                                                    <div className="mt-1 flex gap-1">
                                                        <CopyBtn text={message.content.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || ""} />
                                                        <span className="text-xs text-muted-foreground">Copy raw JSON</span>
                                                    </div>
                                                </>
                                            ) : message.content}
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-2 py-1">
                                            {isActing ? (
                                                <><Wrench className="h-3.5 w-3.5 text-brand animate-spin" /><span className="text-xs text-muted-foreground">Working...</span></>
                                            ) : (
                                                <>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t p-4 bg-background">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="e.g. 2 Instagram reels for Nike, £800 each, due in 30 days..."
                                disabled={isBusy}
                                className="flex-1 text-sm resize-none min-h-[44px] max-h-[120px] border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-50"
                                rows={1}
                            />
                            <Button
                                onClick={handleSend}
                                size="icon"
                                disabled={isBusy || !inputValue.trim()}
                                className="bg-brand hover:bg-brand/90 text-white shrink-0 h-10 w-10"
                            >
                                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter tabs ────────────────────────────────────────── */}
            {invoices.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                    {[
                        { key: "all", label: `All (${totals.all})` },
                        { key: "draft", label: `Draft (${totals.draft})` },
                        { key: "submitted", label: `Submitted (${totals.submitted})` },
                        { key: "overdue", label: `Overdue (${totals.overdue})` },
                        { key: "settled", label: `Settled (${totals.settled})` },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterStatus(tab.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === tab.key
                                    ? "bg-brand text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Invoice list ────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl bg-muted/20">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold mb-1">
                        {filterStatus === "all" ? "No invoices yet" : `No ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()} invoices`}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-6">
                        {filterStatus === "all"
                            ? "Click \"Generate with AI\" to create your first invoice."
                            : "Try a different filter or create a new invoice."}
                    </p>
                    {filterStatus === "all" && (
                        <Button onClick={openAI} className="bg-brand hover:bg-brand/90 text-white gap-2" disabled={hasApiKey === false}>
                            <Plus className="h-4 w-4" />
                            Generate with AI
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((invoice) => (
                        <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
