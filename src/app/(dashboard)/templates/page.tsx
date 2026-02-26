"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Bot,
    Send,
    Loader2,
    Sparkles,
    Copy,
    Check,
    Settings,
    Plus,
    Wrench,
} from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Prompt categories                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
    {
        id: "pre-deal",
        label: "Pre-Deal",
        emoji: "✉️",
        color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
        labelColor: "text-blue-700 bg-blue-100",
        prompts: [
            {
                title: "Brand pitch email",
                subtitle: "Cold outreach to brands",
                message:
                    "I need to write a cold pitch email to a brand to introduce myself and pitch a collaboration. Please ask me for any details you need (brand name, industry, any notes) and then draft a professional, personalised pitch email for me.",
            },
            {
                title: "Rate card response email",
                subtitle: "When a brand asks \"what are your rates?\"",
                message:
                    "A brand has asked me what my rates are. I need to write a professional email responding to their rate enquiry. Please ask me for any details you need (brand name, any specific notes) and draft a confident, professional rate card response email.",
            },
        ],
    },
    {
        id: "negotiation",
        label: "Negotiation & Agreement",
        emoji: "🤝",
        color: "bg-violet-50 border-violet-200 hover:bg-violet-100",
        labelColor: "text-violet-700 bg-violet-100",
        prompts: [
            {
                title: "Brand deal proposal",
                subtitle: "Scope, deliverables, timeline, pricing",
                message:
                    "I need to create a formal brand deal proposal document covering scope of work, deliverables, timeline, and pricing. Please ask me for the details (brand, deliverables, timeline, rate) and then draft a professional proposal.",
            },
            {
                title: "Counter-offer email",
                subtitle: "When the brand lowballs",
                message:
                    "A brand has come back with an offer that's lower than my rate. I need to write a confident, professional counter-offer email. Please ask me for the details (what they offered, what I want, brand name) and help me draft it.",
            },
            {
                title: "Content contract / agreement",
                subtitle: "Terms, usage rights, payment terms, exclusivity",
                message:
                    "I need a content creator contract / collaboration agreement covering deliverables, usage rights, payment terms, and any exclusivity. Please ask me for the details and generate a professional contract template.",
            },
            {
                title: "Usage rights addendum",
                subtitle: "Extending or adding usage after initial deal",
                message:
                    "A brand wants to extend or add usage rights for content I've already created. I need a usage rights addendum to add to the original agreement. Please ask me for the details and draft it professionally.",
            },
        ],
    },
    {
        id: "during-campaign",
        label: "During Campaign",
        emoji: "🎬",
        color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
        labelColor: "text-amber-700 bg-amber-100",
        prompts: [
            {
                title: "Creative brief template",
                subtitle: "What the creator fills in or receives",
                message:
                    "I need a creative brief template for a brand campaign. Please ask me for the campaign details (brand, product, key messages, platform, deliverables, tone) and draft a clear, professional creative brief.",
            },
            {
                title: "Content approval form",
                subtitle: "Sending drafts for sign-off",
                message:
                    "I need a content approval / sign-off form to send to a brand with my draft content. Please ask me for the details (brand, campaign, content type, deadline) and draft a professional approval document.",
            },
            {
                title: "Campaign timeline / schedule",
                subtitle: "Key dates and milestones",
                message:
                    "I need a campaign timeline / schedule document. Please ask me for the campaign details (start date, end date, key milestones, deliverables) and create a clear campaign schedule.",
            },
            {
                title: "Invoice",
                subtitle: "For completed or in-progress work",
                message:
                    "I need to create an invoice for a brand deal. Please ask me for the details (brand name, services, amounts, payment terms, due date) and generate a professional invoice.",
            },
        ],
    },
    {
        id: "post-campaign",
        label: "Post-Campaign",
        emoji: "📊",
        color: "bg-green-50 border-green-200 hover:bg-green-100",
        labelColor: "text-green-700 bg-green-100",
        prompts: [
            {
                title: "Campaign report / analytics summary",
                subtitle: "Showing results, views, engagement",
                message:
                    "I need to create a campaign report / analytics summary to send to the brand after a campaign. Please ask me for the results (views, engagement, reach, key metrics) and draft a professional campaign report.",
            },
            {
                title: "Testimonial request email",
                subtitle: "Asking the brand for a testimonial",
                message:
                    "I want to ask a brand I worked with for a testimonial. Please ask me for any details (brand name, who to contact) and draft a friendly, professional testimonial request email.",
            },
            {
                title: "Re-engagement email",
                subtitle: "\"Loved working together, here's what's next\"",
                message:
                    "I want to follow up with a brand I've previously worked with to propose working together again. Please ask me for the details (brand name, previous campaign, new ideas) and draft a compelling re-engagement email.",
            },
        ],
    },
    {
        id: "admin",
        label: "Admin / Ongoing",
        emoji: "⚖️",
        color: "bg-slate-50 border-slate-200 hover:bg-slate-100",
        labelColor: "text-slate-700 bg-slate-100",
        prompts: [
            {
                title: "NDA template",
                subtitle: "Non-disclosure agreement",
                message:
                    "I need an NDA (non-disclosure agreement) template for working with brands. Please ask me for the details (parties involved, duration, scope) and draft a professional NDA template.",
            },
            {
                title: "Exclusivity clause template",
                subtitle: "For brand partnerships",
                message:
                    "I need an exclusivity clause template to add to a brand partnership agreement. Please ask me for the details (category, duration, compensation) and draft a clear exclusivity clause.",
            },
            {
                title: "Late payment chaser email",
                subtitle: "Chasing overdue invoices",
                message:
                    "A brand hasn't paid my invoice on time and I need to chase them. Please ask me for the details (brand name, invoice amount, how overdue, how many times I've chased already) and help me write a firm but professional chaser email.",
            },
            {
                title: "Tax form / W-9 cover letter",
                subtitle: "For US brands requesting tax forms",
                message:
                    "A US brand has asked me to fill out a W-9 or similar tax form. I need a professional cover letter to accompany it. Please ask me for the details (brand name, any relevant context) and draft a cover letter.",
            },
        ],
    },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Streaming chat hook (mirrors agent-chat-panel pattern)                     */
/* ─────────────────────────────────────────────────────────────────────────── */

function useTemplateChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [status, setStatus] = useState<"ready" | "streaming" | "acting">("ready");
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(
        async (text: string) => {
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
                    }),
                    signal: abortRef.current.signal,
                });

                const cid = res.headers.get("x-conversation-id");
                if (cid) setConversationId(cid);

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: "Something went wrong" }));
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId
                                ? { ...m, content: `⚠️ ${err.error || "Something went wrong"}` }
                                : m
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
        [messages, conversationId]
    );

    const reset = useCallback(() => {
        abortRef.current?.abort();
        setMessages([]);
        setConversationId(null);
        setStatus("ready");
    }, []);

    return { messages, sendMessage, status, reset };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Copy button                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="shrink-0 p-1.5 rounded-md hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Message renderer                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function MessageContent({ content, isStreaming }: { content: string; isStreaming: boolean }) {
    // Detect if content looks like a document (long, has line breaks)
    const isDocument = content.length > 400 && content.includes("\n");

    if (isDocument) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Generated Document</span>
                    {!isStreaming && <CopyButton text={content} />}
                </div>
                <div className="bg-background border border-border rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/90 max-h-[500px] overflow-y-auto">
                    {content}
                </div>
                {!isStreaming && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs"
                        onClick={() => navigator.clipboard.writeText(content)}
                    >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Document
                    </Button>
                )}
            </div>
        );
    }

    return (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main page                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function TemplatesPage() {
    const { messages, sendMessage, status, reset } = useTemplateChat();
    const [inputValue, setInputValue] = useState("");
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const [aiManagerName, setAiManagerName] = useState("AI Manager");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    const isBusy = status === "streaming" || status === "acting";
    const isActing = status === "acting";

    // Check API key
    useEffect(() => {
        fetch("/api/settings/api-key")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => setHasApiKey(d?.hasKey ?? false))
            .catch(() => setHasApiKey(false));

        const stored = localStorage.getItem("aiManagerName");
        if (stored) setAiManagerName(stored);
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(() => {
        const text = inputValue.trim();
        if (!text || isBusy) return;
        setInputValue("");

        // Scroll chat into view on mobile
        chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        sendMessage(text);
    }, [inputValue, isBusy, sendMessage]);

    const handlePromptClick = useCallback((message: string) => {
        if (isBusy) return;
        setInputValue("");
        chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        sendMessage(message);
    }, [isBusy, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /* ── No API key state ──────────────────────────────────────────────── */
    if (hasApiKey === false) {
        return (
            <div className="p-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-semibold">Document Generator</h1>
                    <p className="text-muted-foreground mt-1">
                        Let your AI manager draft any business document for you.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl bg-muted/30">
                    <div className="h-16 w-16 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-brand" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">Connect Your {aiManagerName}</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        Add your Anthropic API key to unlock the document generator. Your AI manager will draft
                        contracts, pitch emails, invoices, and more — with your full brand context.
                    </p>
                    <Link href="/settings?tab=ai">
                        <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                            <Settings className="h-4 w-4" />
                            Set Up API Key
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-3">Typically £3–10/month</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold">Document Generator</h1>
                    <p className="text-muted-foreground mt-1">
                        Click a template or type your own request — your AI manager will ask questions then generate the document.
                    </p>
                </div>
                {messages.length > 0 && (
                    <Button variant="outline" size="sm" onClick={reset} className="gap-2 shrink-0">
                        <Plus className="h-4 w-4" />
                        New Document
                    </Button>
                )}
            </div>

            {/* ── AI Chat Box ─────────────────────────────────────────────── */}
            <div
                ref={chatRef}
                className="border rounded-2xl bg-card shadow-sm overflow-hidden"
            >
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b bg-muted/30">
                    <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{aiManagerName}</p>
                        <p className="text-xs text-muted-foreground">
                            {isBusy ? (
                                <span className="flex items-center gap-1">
                                    {isActing ? (
                                        <><Wrench className="h-3 w-3 animate-spin" /> Working on it...</>
                                    ) : (
                                        "Thinking..."
                                    )}
                                </span>
                            ) : (
                                "Let me know what you need"
                            )}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="min-h-[160px] max-h-[520px] overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <Sparkles className="h-7 w-7 text-brand/40 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Choose a template below or describe what you need.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                {message.role === "assistant" && (
                                    <div className="h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="h-4 w-4 text-brand" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === "user"
                                        ? "bg-brand text-white rounded-br-md"
                                        : "bg-muted rounded-bl-md"
                                        }`}
                                >
                                    {message.content ? (
                                        message.role === "assistant" ? (
                                            <MessageContent
                                                content={message.content}
                                                isStreaming={isBusy && messages[messages.length - 1]?.id === message.id}
                                            />
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                        )
                                    ) : (
                                        <span className="flex items-center gap-2 py-1">
                                            {isActing ? (
                                                <>
                                                    <Wrench className="h-3.5 w-3.5 text-brand animate-spin" />
                                                    <span className="text-xs text-muted-foreground">Working on it...</span>
                                                </>
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
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4 bg-background">
                    <div className="flex gap-2 items-end">
                        <Textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe what you need, or click a template below..."
                            disabled={isBusy || hasApiKey === null}
                            className="flex-1 text-sm resize-none min-h-[44px] max-h-[120px]"
                            rows={1}
                        />
                        <Button
                            onClick={handleSend}
                            size="icon"
                            disabled={isBusy || !inputValue.trim() || hasApiKey === null}
                            className="bg-brand hover:bg-brand/90 text-white shrink-0 h-10 w-10"
                        >
                            {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Shift+Enter</kbd> for new line
                    </p>
                </div>
            </div>

            {/* ── Prompt grid ─────────────────────────────────────────────── */}
            <div className="space-y-8">
                {CATEGORIES.map((category) => (
                    <div key={category.id}>
                        {/* Category header */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">{category.emoji}</span>
                            <h2 className="font-heading font-semibold text-base">{category.label}</h2>
                            <div className="flex-1 h-px bg-border ml-2" />
                        </div>

                        {/* Prompt cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {category.prompts.map((prompt) => (
                                <button
                                    key={prompt.title}
                                    onClick={() => handlePromptClick(prompt.message)}
                                    disabled={isBusy}
                                    className={`text-left p-4 rounded-xl border transition-all duration-150 group relative ${category.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors leading-snug">
                                                {prompt.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                {prompt.subtitle}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${category.labelColor}`}>
                                            {category.emoji}
                                        </span>
                                    </div>
                                    {/* Hover arrow */}
                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Send className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
