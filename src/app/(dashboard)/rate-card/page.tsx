"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Download,
    Loader2,
    Plus,
    Trash2,
    Building2,
} from "lucide-react";

import { ImproveWithAI } from "@/components/ui/improve-with-ai";
import { RateCardPreview, type RateCardData, type RatePackage } from "@/components/rate-card/rate-card-preview";

export default function RateCardPage() {
    const cardRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<RateCardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [targetBrand, setTargetBrand] = useState("");

    // Form state for packages
    const [packages, setPackages] = useState<RatePackage[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/rate-card");
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();

            setData(json);

            // Handle if rateCard is empty or a string
            let parsedPackages: RatePackage[] = [];
            if (Array.isArray(json.rateCard)) {
                parsedPackages = json.rateCard;
            } else if (typeof json.rateCard === 'string' && json.rateCard.length > 0) {
                // Try to parse if it was saved as JSON string, otherwise wrap it
                try {
                    parsedPackages = JSON.parse(json.rateCard);
                } catch (e) {
                    parsedPackages = [{ id: '1', name: 'Standard Rate', price: 'Enquire', description: json.rateCard }];
                }
            }

            if (parsedPackages.length === 0) {
                // Add a default package
                parsedPackages = [
                    { id: Date.now().toString(), name: "Instagram Reel (1x)", price: "£2,500 — £3,000", description: "Organic UGC-style short-form video. Includes concept development, filming, editing, and posting." }
                ];
            }

            setPackages(parsedPackages);
        } catch {
            toast.error("Failed to load rate card data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addPackage = (isUsageRights = false, isExamplePackage = false) => {
        const newPackage: RatePackage = {
            id: Date.now().toString(),
            name: isUsageRights ? "12-Month Usage Licence" : isExamplePackage ? "Example Package" : "New Deliverable",
            price: isUsageRights ? "+40 — 50%" : isExamplePackage ? "£3,500 — £4,500" : "£0",
            description: "",
            isUsageRights,
            isExamplePackage
        };
        setPackages([...packages, newPackage]);
    };

    const updatePackage = (id: string, field: keyof RatePackage, value: string | boolean) => {
        setPackages(packages.map(pkg => pkg.id === id ? { ...pkg, [field]: value } : pkg));
    };

    const removePackage = (id: string) => {
        setPackages(packages.filter(pkg => pkg.id !== id));
    };

    const saveRateCard = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/rate-card", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rateCard: packages }),
            });
            if (!res.ok) throw new Error("Failed to save");

            // Only update the rate card portion of the data
            if (data) {
                setData({ ...data, rateCard: packages });
            }

            toast.success("Rate card saved successfully!");
        } catch (err) {
            toast.error("Failed to save rate card");
        } finally {
            setSaving(false);
        }
    };

    const downloadPng = async () => {
        if (!cardRef.current) return;
        setExporting(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                backgroundColor: "transparent",
            });
            const link = document.createElement("a");
            link.download = `${data?.brand.name?.replace(/\s+/g, "-") ?? "rate-card"}-rate-card.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Rate card downloaded!");
        } catch (err) {
            console.error("Export error:", err);
            toast.error("Failed to export rate card");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return null;

    // Use current packages for live preview
    const liveData = { ...data, rateCard: packages };

    return (
        <div className="container p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* ── Left Sidebar: Controls ── */}
                <div className="w-full md:w-96 flex-shrink-0 space-y-6">
                    <div>
                        <h1 className="text-2xl font-heading font-semibold">Rate Card Builder</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Build, customize, and export your professional rate card.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                Customise for Brand (Optional)
                            </Label>
                            <Input
                                placeholder="e.g. Nike, Sustainable Fashion..."
                                value={targetBrand}
                                onChange={(e) => setTargetBrand(e.target.value)}
                                className="bg-white"
                            />
                            <p className="text-xs text-muted-foreground">
                                The AI will use this context to tailor your package descriptions.
                            </p>
                        </div>
                    </div>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Rates & Packages</CardTitle>
                            <CardDescription>
                                Standard deliverables, usage modifiers, and bundle examples.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-6">
                                {packages.map((pkg, index) => (
                                    <div key={pkg.id} className="relative p-4 border rounded-xl bg-card border-border/50 shadow-sm space-y-4">
                                        <button
                                            onClick={() => removePackage(pkg.id)}
                                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1"
                                            title="Delete package"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        {/* Status badges */}
                                        <div className="flex items-center gap-2 mb-2 pr-8">
                                            {pkg.isUsageRights && <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Usage Rights</span>}
                                            {pkg.isExamplePackage && <span className="text-[10px] uppercase font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Example Package</span>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Deliverable/Name</Label>
                                                <Input
                                                    value={pkg.name}
                                                    onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                                                    placeholder="e.g. Instagram Reel"
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Price/Rate</Label>
                                                <Input
                                                    value={pkg.price}
                                                    onChange={(e) => updatePackage(pkg.id, "price", e.target.value)}
                                                    placeholder="e.g. £2,500"
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Description (Optional)</Label>
                                            <Textarea
                                                value={pkg.description}
                                                onChange={(e) => updatePackage(pkg.id, "description", e.target.value)}
                                                placeholder="What's included..."
                                                className="text-sm resize-none bg-white transition-all focus:min-h-[100px]"
                                                rows={2}
                                            />
                                            <ImproveWithAI
                                                value={pkg.description}
                                                onImproved={(text) => updatePackage(pkg.id, "description", text)}
                                                fieldType="generic"
                                                context={targetBrand ? `Customise this content creator deliverables package description specifically for a potential partnership with: ${targetBrand}. Make it sound highly appealing to them.` : "Make this content creator deliverables package description sound professional, appealing, and clear."}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button onClick={() => addPackage(false, false)} variant="outline" className="w-full justify-start text-sm" size="sm">
                                    <Plus className="h-4 w-4 mr-2 text-brand" /> Add Standard Deliverable
                                </Button>
                                <Button onClick={() => addPackage(true, false)} variant="outline" className="w-full justify-start text-sm" size="sm">
                                    <Plus className="h-4 w-4 mr-2 text-amber-600" /> Add Usage Rights Modifier
                                </Button>
                                <Button onClick={() => addPackage(false, true)} variant="outline" className="w-full justify-start text-sm" size="sm">
                                    <Plus className="h-4 w-4 mr-2 text-green-600" /> Add Example Package
                                </Button>
                            </div>

                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-3">
                        <Button
                            className="w-full"
                            onClick={saveRateCard}
                            disabled={saving}
                        >
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Rate Card
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={downloadPng}
                            disabled={exporting}
                            className="w-full font-semibold border"
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Export as PNG
                        </Button>
                    </div>
                </div>

                {/* ── Right Column: Preview ── */}
                <div className="flex-1 bg-zinc-100/50 rounded-3xl border border-zinc-200/60 p-8 flex items-start justify-center overflow-auto min-h-[800px]">
                    <div className="relative shadow-2xl rounded-[28px] overflow-hidden bg-white group">
                        <RateCardPreview ref={cardRef} data={liveData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
