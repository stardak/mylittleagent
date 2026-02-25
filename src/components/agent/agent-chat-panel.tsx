"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Bot,
    Send,
    Plus,
    ChevronLeft,
    History,
    Trash2,
    MessageSquare,
    Loader2,
    Sparkles,
    Settings,
    PanelRightClose,
    CheckCircle2,
    Wrench,
    Pencil,
    Check,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

type Conversation = {
    id: string;
    title: string | null;
    updatedAt: string;
    _count?: { messages: number };
};

type AgentChatPanelProps = {
    isOpen: boolean;
    onToggle: () => void;
    hasApiKey: boolean | null;
};

/* ------------------------------------------------------------------ */
/*  Tool action detection                                              */
/* ------------------------------------------------------------------ */
const ACTION_PATTERNS = [
    /I(?:'ve|'ve| have) (?:added|created|moved|drafted|updated|set up)/i,
    /(?:Added|Created|Moved|Drafted|Updated|Set up) .+? (?:to|for|from|in)/i,
    /Draft email saved/i,
    /pipeline/i,
    /campaign .+? created/i,
];

function hasActionIndicator(text: string): boolean {
    return ACTION_PATTERNS.some((pattern) => pattern.test(text));
}

/* ------------------------------------------------------------------ */
/*  Custom streaming chat hook (avoids fighting AI SDK v6 API)         */
/* ------------------------------------------------------------------ */
function useAgentChat() {
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

                // Get conversation ID from header
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

                // Stream the text response
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

                        // If we haven't received text for a bit, the agent may be executing tools
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

    const clear = useCallback(() => {
        abortRef.current?.abort();
        setMessages([]);
        setConversationId(null);
        setStatus("ready");
    }, []);

    return { messages, setMessages, sendMessage, status, conversationId, setConversationId, clear };
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function AgentChatPanel({ isOpen, onToggle, hasApiKey }: AgentChatPanelProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [editingConvoId, setEditingConvoId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    const {
        messages,
        setMessages,
        sendMessage,
        status,
        conversationId,
        setConversationId,
        clear,
    } = useAgentChat();

    const isBusy = status === "streaming" || status === "acting";
    const isActing = status === "acting";

    // Read custom AI Manager name from localStorage
    const [aiManagerName, setAiManagerName] = useState("AI Manager");
    useEffect(() => {
        const stored = localStorage.getItem("aiManagerName");
        if (stored) setAiManagerName(stored);
    }, []);

    const fetchConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch {
            console.error("Failed to load conversations");
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    useEffect(() => {
        if (hasApiKey && isOpen) {
            fetchConversations();
        }
    }, [hasApiKey, isOpen, fetchConversations]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && hasApiKey) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, hasApiKey]);

    const loadConversation = async (convoId: string) => {
        try {
            const res = await fetch(`/api/conversations/${convoId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(
                    data.messages.map((m: { id: string; role: string; content: string }) => ({
                        id: m.id,
                        role: m.role as "user" | "assistant",
                        content: m.content,
                    }))
                );
                setConversationId(convoId);
                setShowHistory(false);
            }
        } catch {
            console.error("Failed to load conversation");
        }
    };

    const startNewChat = () => {
        clear();
        setShowHistory(false);
        setInputValue("");
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const deleteConversation = async (convoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/conversations/${convoId}`, { method: "DELETE" });
            setConversations((prev) => prev.filter((c) => c.id !== convoId));
            if (conversationId === convoId) {
                startNewChat();
            }
        } catch {
            console.error("Failed to delete conversation");
        }
    };

    const startRenaming = (convoId: string, currentTitle: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingConvoId(convoId);
        setEditingTitle(currentTitle || "");
        setTimeout(() => editInputRef.current?.focus(), 50);
    };

    const saveRename = async () => {
        if (!editingConvoId || !editingTitle.trim()) {
            setEditingConvoId(null);
            return;
        }
        try {
            const res = await fetch(`/api/conversations/${editingConvoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editingTitle.trim() }),
            });
            if (res.ok) {
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === editingConvoId ? { ...c, title: editingTitle.trim() } : c
                    )
                );
            }
        } catch {
            console.error("Failed to rename conversation");
        } finally {
            setEditingConvoId(null);
        }
    };

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || isBusy) return;
        setInputValue("");
        sendMessage(text);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // ── Collapsed: just the toggle tab ──────────────────────────────────
    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-brand text-white p-2.5 rounded-l-lg shadow-lg hover:bg-brand/90 transition-all group"
                aria-label={`Open ${aiManagerName}`}
            >
                <Bot className="h-5 w-5" />
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {aiManagerName}
                </span>
            </button>
        );
    }

    // ── Locked: no API key ──────────────────────────────────────────────
    if (hasApiKey === false) {
        return (
            <div className="w-[400px] border-l bg-card flex flex-col h-screen shrink-0">
                <PanelHeader title={aiManagerName} onToggle={onToggle} />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-brand" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">Connect Your {aiManagerName}</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Add your Anthropic API key to unlock your personal AI talent manager. It can help with pitches,
                        contracts, strategy, and managing your pipeline.
                    </p>
                    <Link href="/settings?tab=ai">
                        <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                            <Settings className="h-4 w-4" />
                            Set Up API Key
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-3">Typically £3-10/month</p>
                </div>
            </div>
        );
    }

    // ── Loading: checking API key ───────────────────────────────────────
    if (hasApiKey === null) {
        return (
            <div className="w-[400px] border-l bg-card flex items-center justify-center h-screen shrink-0">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ── History view ────────────────────────────────────────────────────
    if (showHistory) {
        return (
            <div className="w-[400px] border-l bg-card flex flex-col h-screen shrink-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-heading font-semibold">Chat History</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onToggle}>
                        <PanelRightClose className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-3">
                    <Button onClick={startNewChat} className="w-full bg-brand hover:bg-brand/90 text-white gap-2">
                        <Plus className="h-4 w-4" />
                        New Chat
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No conversations yet. Start a new chat!
                        </div>
                    ) : (
                        <div className="space-y-0.5 p-2">
                            {conversations.map((convo) => (
                                <button
                                    key={convo.id}
                                    onClick={() => editingConvoId !== convo.id && loadConversation(convo.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-muted group ${conversationId === convo.id ? "bg-muted" : ""
                                        }`}
                                >
                                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        {editingConvoId === convo.id ? (
                                            <form
                                                onSubmit={(e) => { e.preventDefault(); saveRename(); }}
                                                className="flex items-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    ref={editInputRef}
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onBlur={saveRename}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape") {
                                                            e.preventDefault();
                                                            setEditingConvoId(null);
                                                        }
                                                    }}
                                                    className="flex-1 text-sm font-medium bg-background border rounded px-1.5 py-0.5 outline-none focus:border-brand"
                                                    placeholder="Chat title..."
                                                />
                                                <button
                                                    type="submit"
                                                    className="p-0.5 hover:bg-brand/10 rounded"
                                                    onClick={(e) => { e.stopPropagation(); saveRename(); }}
                                                >
                                                    <Check className="h-3.5 w-3.5 text-brand" />
                                                </button>
                                            </form>
                                        ) : (
                                            <p className="text-sm font-medium truncate">
                                                {convo.title || "New conversation"}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {formatTime(convo.updatedAt)}
                                            {convo._count?.messages ? ` · ${convo._count.messages} messages` : ""}
                                        </p>
                                    </div>
                                    {editingConvoId !== convo.id && (
                                        <div className="flex items-center gap-0.5">
                                            <button
                                                onClick={(e) => startRenaming(convo.id, convo.title || "", e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted-foreground/10 rounded transition-all"
                                                title="Rename"
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={(e) => deleteConversation(convo.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </button>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Active chat ─────────────────────────────────────────────────────
    return (
        <div className="w-[400px] border-l bg-card flex flex-col h-screen shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Bot className="h-5 w-5 text-brand shrink-0" />
                    <span className="font-heading font-semibold truncate">
                        {conversationId
                            ? conversations.find((c) => c.id === conversationId)?.title || aiManagerName
                            : aiManagerName}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={startNewChat} title="New chat" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setShowHistory(true); fetchConversations(); }}
                        title="Chat history"
                        className="h-8 w-8"
                    >
                        <History className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
                        <PanelRightClose className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="h-14 w-14 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                            <Sparkles className="h-7 w-7 text-brand" />
                        </div>
                        <h3 className="font-heading font-semibold mb-1">Hey! I&apos;m {aiManagerName}</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            I can help with pitches, rates, contracts, pipeline strategy, and more. What are you working on?
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {[
                                "Help me pitch to a brand",
                                "Review my rate card",
                                "Pipeline overview",
                                "Draft a follow-up email",
                                "Draft a contract",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => { setInputValue(""); sendMessage(suggestion); }}
                                    className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-full transition-colors text-foreground"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
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
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${message.role === "user"
                                    ? "bg-brand text-white rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                    }`}
                            >
                                {/* Action indicator for tool-call messages */}
                                {message.role === "assistant" && message.content && hasActionIndicator(message.content) && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Action taken</span>
                                    </div>
                                )}
                                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {message.content || (
                                        <span className="flex items-center gap-2 py-1">
                                            {isActing ? (
                                                <>
                                                    <Wrench className="h-3.5 w-3.5 text-brand animate-spin" />
                                                    <span className="text-xs text-muted-foreground">Taking action...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask your AI manager..."
                        disabled={isBusy}
                        className="flex-1 text-sm"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isBusy || !inputValue.trim()}
                        className="bg-brand hover:bg-brand/90 text-white shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tiny sub-component                                                 */
/* ------------------------------------------------------------------ */
function PanelHeader({ title, onToggle }: { title: string; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-brand" />
                <span className="font-heading font-semibold">{title}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onToggle}>
                <PanelRightClose className="h-4 w-4" />
            </Button>
        </div>
    );
}
