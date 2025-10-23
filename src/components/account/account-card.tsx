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
        <Card className={cn("rounded-3xl border border-green-100/80 bg-white/90 shadow-sm", className)}>
            <CardHeader
                className={cn(
                    "flex flex-col gap-3 border-b border-green-100/70 pb-4 md:flex-row md:items-center md:justify-between",
                    headerClassName
                )}
            >
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-green-600">{title}</CardTitle>
                    {description ? (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                <AccountPasswordDialog
                    onSubmit={onPasswordSubmit}
                    onSuccess={onPasswordSuccess}
                    triggerAriaLabel={triggerAriaLabel}
                />
            </CardHeader>
            <CardContent className={cn("pt-6", contentClassName)}>{children}</CardContent>
        </Card>
    );
}
