"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { Toaster, toast } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Monitors the session and signs out users whose accounts become inactive.
 */
function SessionWatcher() {
    const { data: session } = useSession();
    const router = useRouter();
    const hasHandledInactive = useRef(false);

    useEffect(() => {
        if (session?.user?.status !== "Inactive") {
            hasHandledInactive.current = false;
            return;
        }
        if (hasHandledInactive.current) return;

        hasHandledInactive.current = true;
        toast.error("Your account has been deactivated. Logging out...");
        void signOut({ redirect: false, callbackUrl: "/login?error=inactive" })
            .then((data) => {
                if (data?.url) router.replace(data.url);
            })
            .catch(() => {
                router.replace("/login?error=inactive");
            });
    }, [router, session]);

    return null;
}

/**
 * Sets up global providers for authentication, toasts, and session feedback.
 */
export default function Providers({ children }: { children: ReactNode }) {
    const hasHandledInitialFeedback = useRef(false);
    useEffect(() => {
        if (hasHandledInitialFeedback.current) return;
        const url = new URL(window.location.href);
        const params = url.searchParams;

        if (params.has("logout") && params.get("logout") === "success") {
            toast.success("You have been logged out successfully.", {
                position: "top-center",
                duration: 2500,
            });
            params.delete("logout");
            window.history.replaceState({}, "", url.toString());
        }

        if (params.has("login") && params.get("login") === "success") {
            toast.success("Welcome!", {
                position: "top-center",
                duration: 2500,
            });
            params.delete("login");
            window.history.replaceState({}, "", url.toString());
        }
        hasHandledInitialFeedback.current = true;
    }, []);

    return (
        <ThemeProvider>
            <SessionProvider>
                {children}
                <ThemeToggle className="fixed bottom-6 right-6 z-50" />
                <Toaster richColors position="top-center" />
                <SessionWatcher /> {/* runs globally */}
            </SessionProvider>
        </ThemeProvider>
    );
}
