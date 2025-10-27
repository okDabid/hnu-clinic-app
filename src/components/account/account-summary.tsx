"use client";

import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type AccountSummaryAccent = "emerald" | "teal" | "amber" | "indigo" | "rose";

const ACCENT_STYLES: Record<
    AccountSummaryAccent,
    {
        card: string;
        icon: string;
        gradient: string;
        progress: string;
    }
> = {
    emerald: {
        card: "border-emerald-100/70",
        icon: "bg-emerald-100 text-emerald-600",
        gradient: "from-emerald-50 via-transparent to-emerald-100/60",
        progress: "bg-emerald-500",
    },
    teal: {
        card: "border-teal-100/70",
        icon: "bg-teal-100 text-teal-600",
        gradient: "from-teal-50 via-transparent to-teal-100/60",
        progress: "bg-teal-500",
    },
    amber: {
        card: "border-amber-100/70",
        icon: "bg-amber-100 text-amber-600",
        gradient: "from-amber-50 via-transparent to-amber-100/60",
        progress: "bg-amber-500",
    },
    indigo: {
        card: "border-indigo-100/70",
        icon: "bg-indigo-100 text-indigo-600",
        gradient: "from-indigo-50 via-transparent to-indigo-100/60",
        progress: "bg-indigo-500",
    },
    rose: {
        card: "border-rose-100/70",
        icon: "bg-rose-100 text-rose-600",
        gradient: "from-rose-50 via-transparent to-rose-100/60",
        progress: "bg-rose-500",
    },
};

export type AccountSummaryItem = {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    helper?: ReactNode;
    progress?: number;
    accent?: AccountSummaryAccent;
};

export interface AccountSummaryGridProps {
    items: AccountSummaryItem[];
    className?: string;
}

export function AccountSummaryGrid({ items, className }: AccountSummaryGridProps) {
    if (!items.length) {
        return null;
    }

    return (
        <div className={cn("grid gap-4 md:grid-cols-3", className)}>
            {items.map((item, index) => {
                const Icon = item.icon;
                const accent = ACCENT_STYLES[item.accent ?? "emerald"];
                const progressValue =
                    typeof item.progress === "number"
                        ? Math.min(100, Math.max(0, Number.isFinite(item.progress) ? item.progress : 0))
                        : undefined;

                return (
                    <div
                        key={`${item.label}-${index}`}
                        className={cn(
                            "relative overflow-hidden rounded-3xl border bg-white/90 shadow-sm backdrop-blur",
                            accent.card
                        )}
                    >
                        <div
                            aria-hidden
                            className={cn(
                                "pointer-events-none absolute inset-0 opacity-60 blur-sm",
                                "bg-gradient-to-br",
                                accent.gradient
                            )}
                        />
                        <div className="relative flex h-full flex-col gap-3 px-5 py-5">
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-medium shadow-sm",
                                        accent.icon
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {item.label}
                                </span>
                            </div>

                            <div className="text-lg font-semibold text-slate-900">
                                {typeof item.value === "string" ? <span>{item.value}</span> : item.value}
                            </div>

                            {progressValue !== undefined ? (
                                <Progress
                                    value={progressValue}
                                    className="h-2"
                                    indicatorClassName={accent.progress}
                                    aria-label={`${item.label} progress`}
                                />
                            ) : null}

                            {item.helper ? (
                                <div className="text-sm text-muted-foreground">
                                    {typeof item.helper === "string" ? <p>{item.helper}</p> : item.helper}
                                </div>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default AccountSummaryGrid;
