import { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DashboardStat = {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
};

interface DashboardStatStripProps {
    stats: DashboardStat[];
    className?: string;
}

export function DashboardStatStrip({ stats, className }: DashboardStatStripProps) {
    return (
        <section className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
            {stats.map(({ label, value, hint, icon: Icon }) => (
                <Card key={label} className="rounded-2xl border-white/70 bg-white/85 p-4 shadow-sm shadow-slate-900/5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                            <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
                            <p className="text-xs text-slate-500">{hint}</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                        </span>
                    </div>
                </Card>
            ))}
        </section>
    );
}
