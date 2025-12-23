"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";

const ALPHABET = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));

export interface AlphabetFilterProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function AlphabetFilter({ label = "Filter by initial", value, onChange, disabled }: AlphabetFilterProps) {
    const options = useMemo(() => ["All", ...ALPHABET], []);

    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">{label}</p>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isActive = value === option;
                    return (
                        <Button
                            key={option}
                            type="button"
                            size="sm"
                            variant={isActive ? "default" : "outline"}
                            className={`h-8 px-3 ${isActive ? "bg-primary text-white hover:bg-primary" : ""}`}
                            onClick={() => onChange(option)}
                            disabled={disabled}
                        >
                            {option}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
