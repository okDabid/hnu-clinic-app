import { Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ActivityItem = {
    label: string;
    detail: string;
    type: "success" | "warning" | "error" | "info";
};

type ActivityFeedProps = {
    title?: string;
    items: ActivityItem[];
};

export function ActivityFeed({ title = "Recent activity", items }: ActivityFeedProps) {
    return (
        <Card className="rounded-2xl border-border/70 bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-primary">
                    <Activity className="h-4 w-4" /> {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item) => (
                    <div key={item.label + item.detail} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <Badge
                                className={
                                    item.type === "success"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : item.type === "warning"
                                            ? "bg-amber-100 text-amber-700"
                                            : item.type === "error"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-blue-100 text-blue-700"
                                }
                            >
                                {item.type}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
