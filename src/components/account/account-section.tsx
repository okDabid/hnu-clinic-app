"use client";

import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AccountSectionProps {
    icon: LucideIcon;
    title: string;
    description?: ReactNode;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
}

export function AccountSection({
    icon: Icon,
    title,
    description,
    children,
    className,
    contentClassName,
}: AccountSectionProps) {
    return (
        <section
            className={cn(
                "overflow-hidden rounded-3xl border border-green-100/70 bg-white/95 shadow-sm backdrop-blur",
                className
            )}
        >
            <header className="flex items-start gap-4 border-b border-green-100/70 px-6 py-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 shadow-inner">
                    <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-green-700">{title}</h3>
                    {description ? (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    ) : null}
                </div>
            </header>
            <div className={cn("space-y-4 px-6 py-6", contentClassName)}>{children}</div>
        </section>
    );
}

export default AccountSection;
