"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full border border-transparent text-green-600 transition hover:border-green-200 hover:bg-green-50",
        "dark:text-emerald-200 dark:hover:border-emerald-400/50 dark:hover:bg-emerald-400/10",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
    >
      <Sun className={cn("h-4 w-4", mounted && isDark ? "hidden" : "")} />
      <Moon className={cn("h-4 w-4", mounted && !isDark ? "hidden" : "")} />
    </Button>
  );
}
