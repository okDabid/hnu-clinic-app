"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type AccountRefreshButtonProps = {
    onClick: () => void;
    disabled?: boolean;
    isRefreshing?: boolean;
};

export function AccountRefreshButton({
    onClick,
    disabled = false,
    isRefreshing = false,
}: AccountRefreshButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 rounded-2xl border-green-200 bg-white/95 px-5 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 disabled:opacity-60"
            onClick={onClick}
            disabled={disabled}
        >
            {isRefreshing ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Refreshing…
                </>
            ) : (
                "Refresh profile"
            )}
        </Button>
    );
}

export default AccountRefreshButton;
