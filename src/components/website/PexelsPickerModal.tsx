"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X, ImageIcon } from "lucide-react";

type PexelsPhoto = {
    id: number;
    url: string;
    thumbnail: string;
    photographer: string;
    photographerUrl: string;
    alt: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string, attribution: string) => void;
    defaultQuery?: string;
};

export function PexelsPickerModal({ open, onClose, onSelect, defaultQuery = "lifestyle photography" }: Props) {
    const [query, setQuery] = useState(defaultQuery);
    const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pexels?query=${encodeURIComponent(q)}&per_page=18`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Search failed");
            setPhotos(data.photos ?? []);
        } catch (e) {
            setError((e as Error).message);
            setPhotos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + re-search when modal opens
    useEffect(() => {
        if (open) {
            search(query);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Debounced search on query change
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (open) search(query);
        }, 450);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, open, search]);

    const handleSelect = (photo: PexelsPhoto) => {
        const attribution = `Photo by ${photo.photographer} on Pexels`;
        onSelect(photo.url, attribution);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-semibold">Browse Free Photos</DialogTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">Powered by Pexels · Free to use with attribution</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search photos…"
                            className="pl-9"
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Searching Pexels…</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2">
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No photos found. Try a different search.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {photos.map((photo) => (
                                    <button
                                        key={photo.id}
                                        onClick={() => handleSelect(photo)}
                                        className="relative group aspect-[4/3] overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                                        title={photo.alt || photo.photographer}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={photo.thumbnail}
                                            alt={photo.alt || photo.photographer}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 p-2">
                                            <span className="text-white text-xs font-semibold">Use this photo</span>
                                            <span className="text-white/70 text-[10px] truncate max-w-full">by {photo.photographer}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {/* Attribution required by Pexels licence */}
                            <p className="text-[10px] text-muted-foreground/60 text-center mt-4">
                                Photos provided by{" "}
                                <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">
                                    Pexels
                                </a>
                                . Attribution is added automatically when you select a photo.
                            </p>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
