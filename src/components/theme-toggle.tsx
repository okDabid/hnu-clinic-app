"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "default";
};

export function ThemeToggle({ className, size = "default" }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "icon" : "default"}
        className={cn(
          "rounded-full border border-border/60 bg-background/80 text-foreground",
          size === "sm" && "h-9 w-9",
          className
        )}
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      className={cn(
        "rounded-full border border-border/60 bg-background/80 text-foreground transition-colors",
        "hover:bg-muted/60 hover:text-foreground",
        size === "sm" && "h-9 w-9",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="sr-only">Toggle theme</span>
      <Sun className={cn("h-4 w-4", isDark && "hidden")}
      />
      <Moon className={cn("h-4 w-4", !isDark && "hidden")}
      />
    </Button>
  );
}
