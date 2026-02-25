"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-semibold">Analytics</h1>
                <p className="text-muted-foreground mt-1">
                    Track performance across campaigns, revenue, and growth.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Revenue</CardTitle>
                        <CardDescription>Monthly revenue breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">Not enough data yet</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Pipeline</CardTitle>
                        <CardDescription>Conversion rates</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">Not enough data yet</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Content</CardTitle>
                        <CardDescription>Performance trends</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">Not enough data yet</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
