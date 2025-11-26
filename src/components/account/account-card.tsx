"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

import type { AccountPasswordSubmit } from "@/components/account/account-password-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AccountCardProps {
    children: ReactNode;
    title?: string;
    description?: ReactNode;
    onPasswordSubmit: AccountPasswordSubmit;
    onPasswordSuccess?: (message: string) => void;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    triggerAriaLabel?: string;
}

const AccountPasswordDialog = dynamic(
    () =>
        import("@/components/account/account-password-dialog").then(
            (mod) => mod.AccountPasswordDialog
        ),
    {
        loading: () => (
            <div className="rounded-xl border border-green-100/80 bg-white/90 px-3 py-2 text-sm text-muted-foreground">
                Preparing security tools…
            </div>
        ),
        ssr: false,
    }
);

export function AccountCard({
    children,
    title = "My account",
    description,
    onPasswordSubmit,
    onPasswordSuccess,
    className,
    headerClassName,
    contentClassName,
    triggerAriaLabel,
}: AccountCardProps) {
    return (
        <Card
            className={cn(
                "relative overflow-hidden rounded-4xl border border-green-100/70 bg-white/95 shadow-xl backdrop-blur",
                className
            )}
        >
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl" />
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-200/40 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-emerald-50/60 blur-2xl" />
            </div>
            <CardHeader
                className={cn(
                    "relative flex flex-col gap-4 border-b border-white/10 bg-linear-to-r from-emerald-600 via-green-600 to-emerald-500 px-6 py-6 text-white md:flex-row md:items-center md:justify-between",
                    headerClassName
                )}
            >
                <div className="space-y-1">
                    <CardTitle className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm">
                        {title}
                    </CardTitle>
                    {description ? (
                        <p className="text-sm text-emerald-50/90 md:max-w-xl">{description}</p>
                    ) : null}
                </div>
                <AccountPasswordDialog
                    onSubmit={onPasswordSubmit}
                    onSuccess={onPasswordSuccess}
                    triggerAriaLabel={triggerAriaLabel}
                    triggerClassName="justify-between border-white/50 bg-white/15 text-white backdrop-blur md:w-auto md:justify-start"
                    dialogTitle="Update account password"
                />
            </CardHeader>
            <CardContent className={cn("relative space-y-8 px-6 py-8", contentClassName)}>{children}</CardContent>
        </Card>
    );
}
