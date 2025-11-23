import { ReactNode } from "react";

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
                "rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-white to-primary/5 p-6 shadow-sm",
                className,
            )}
        >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">{eyebrow}</p>
                    <h3 className="text-3xl font-semibold text-primary md:text-4xl">{heading}</h3>
                    <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
                </div>
                {children}
            </div>
        </section>
    );
}
