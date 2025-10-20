"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useNetworkStatus } from "@/hooks/use-network-status";

type ToastId = string | number | undefined;

export function NetworkStatusToast() {
    const { isOnline, isSlow, effectiveType } = useNetworkStatus();
    const offlineToastId = useRef<ToastId>(undefined);
    const slowToastId = useRef<ToastId>(undefined);

    useEffect(() => {
        if (!isOnline) {
            if (offlineToastId.current == null) {
                offlineToastId.current = toast.warning("You are offline", {
                    description: "We'll keep showing any cached data until the connection returns.",
                    duration: Infinity,
                    closeButton: true,
                });
            }
            return;
        }

        if (offlineToastId.current != null) {
            toast.dismiss(offlineToastId.current);
            offlineToastId.current = undefined;
            toast.success("Back online", {
                description: "Refreshing data with the latest updates.",
                duration: 3000,
            });
        }
    }, [isOnline]);

    useEffect(() => {
        if (!isOnline) {
            if (slowToastId.current != null) {
                toast.dismiss(slowToastId.current);
                slowToastId.current = undefined;
            }
            return;
        }

        if (isSlow) {
            if (slowToastId.current == null) {
                slowToastId.current = toast.info("Slow connection detected", {
                    description: effectiveType === "unknown"
                        ? "Some requests may take a while. We'll reuse cached data when possible."
                        : `Network type: ${effectiveType}. Some requests may take a while.`,
                    duration: Infinity,
                    closeButton: true,
                });
            }
        } else if (slowToastId.current != null) {
            toast.dismiss(slowToastId.current);
            slowToastId.current = undefined;
        }
    }, [effectiveType, isOnline, isSlow]);

    return null;
}
