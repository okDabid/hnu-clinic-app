import { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    helper?: string;
    trendLabel?: string;
    trendValue?: string;
}

export function StatCard({ title, value, helper, icon: Icon, trendLabel, trendValue }: StatCardProps) {
    return (
        <Card className="group relative overflow-hidden rounded-3xl border-primary/15 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-primary/80 via-emerald-500 to-primary/70" />
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <CardTitle className="text-3xl font-semibold text-primary">{value}</CardTitle>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </span>
            </CardHeader>
            {(helper || trendLabel || trendValue) && (
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>{helper}</p>
                    {(trendLabel || trendValue) && (
                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                            {trendLabel && <span className="mr-1 font-medium">{trendLabel}</span>}
                            {trendValue}
                        </Badge>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
