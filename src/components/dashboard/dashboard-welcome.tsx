import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardWelcomeProps {
    eyebrow?: string;
    heading: string;
    description: string;
    className?: string;
    children?: ReactNode;
}

export function DashboardWelcome({
    eyebrow = "Welcome back",
    heading,
    description,
    className,
    children,
}: DashboardWelcomeProps) {
    return (
        <section
            className={cn(
                "relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur xl:p-8",
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.16),transparent_35%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                        <Sparkles className="h-3.5 w-3.5" />
                        {eyebrow}
                    </p>
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{heading}</h3>
                    <p className="max-w-2xl text-sm text-slate-600 md:text-base">{description}</p>
                </div>
                {children}
            </div>
        </section>
    );
}
