"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";

export default function InvoicesPage() {
    const handleNewInvoice = () => {
        toast.info("Coming Soon", {
            description: "Invoice generation is on the roadmap. You'll be able to create, send, and track invoices here.",
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold">Invoices</h1>
                    <p className="text-muted-foreground mt-1">
                        Create, send, and track invoices for your campaigns.
                    </p>
                </div>
                <Button className="bg-brand hover:bg-brand/90 text-white gap-2" onClick={handleNewInvoice}>
                    <Plus className="h-4 w-4" />
                    New Invoice
                </Button>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold mb-1">No invoices yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                        Invoices will appear here once you create them from your campaigns.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
