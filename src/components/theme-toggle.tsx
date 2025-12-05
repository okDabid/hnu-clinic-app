"use client";

import { useEffect, useState } from "react";
import { Laptop, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
    { label: "Light", value: "light", icon: SunMedium },
    { label: "Dark", value: "dark", icon: MoonStar },
    { label: "System", value: "system", icon: Laptop },
] as const;

/**
 * A compact, reusable toggle for switching themes across the site.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { setTheme, resolvedTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const activeTheme = theme === "system" ? resolvedTheme : theme;

    return (
        <div
            className={cn(
                "flex items-center gap-1 rounded-full border bg-card/80 p-1 text-xs shadow-lg backdrop-blur", 
                "supports-[backdrop-filter]:backdrop-blur", 
                className,
            )}
            aria-label="Switch theme"
        >
            {themes.map(({ label, value, icon: Icon }) => {
                const isActive = mounted ? activeTheme === value || theme === value : value === "system";

                return (
                    <Button
                        key={value}
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                            "flex items-center gap-2 rounded-full px-3 transition", 
                            !isActive && "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setTheme(value)}
                        aria-pressed={isActive}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{label}</span>
                    </Button>
                );
            })}
        </div>
    );
}
