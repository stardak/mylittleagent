"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
    const handleNewTemplate = () => {
        toast.info("Coming Soon", {
            description: "Email template builder is on the roadmap. You'll be able to create reusable templates for outreach and follow-ups.",
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold">Email Templates</h1>
                    <p className="text-muted-foreground mt-1">
                        Reusable templates for outreach, follow-ups, and more.
                    </p>
                </div>
                <Button className="bg-brand hover:bg-brand/90 text-white gap-2" onClick={handleNewTemplate}>
                    <Plus className="h-4 w-4" />
                    New Template
                </Button>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Mail className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold mb-1">No templates yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                        Create email templates for cold outreach, follow-ups, proposals, and more.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
