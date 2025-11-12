"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    MEDICAL_HISTORY_OPTIONS,
    type MedicalHistoryOption,
    type MedicalHistoryValue,
} from "@/lib/medical-history";
import { cn } from "@/lib/utils";

function optionId(option: MedicalHistoryOption, prefix: string) {
    return `${prefix}-${option.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export type MedicalHistoryFieldProps = {
    value: MedicalHistoryValue;
    onChange: (value: MedicalHistoryValue) => void;
    disabled?: boolean;
    idPrefix?: string;
    className?: string;
};

export function MedicalHistoryField({
    value,
    onChange,
    disabled,
    idPrefix = "medical-history",
    className,
}: MedicalHistoryFieldProps) {
    const toggleOption = (option: MedicalHistoryOption, nextChecked: boolean) => {
        const nextConditions = nextChecked
            ? Array.from(new Set([...value.conditions, option]))
            : value.conditions.filter((item) => item !== option);

        onChange({
            ...value,
            conditions: nextConditions,
        });
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="grid gap-3 md:grid-cols-2">
                {MEDICAL_HISTORY_OPTIONS.map((option) => {
                    const id = optionId(option, idPrefix);
                    return (
                        <label key={option} htmlFor={id} className="flex items-center gap-2">
                            <Checkbox
                                id={id}
                                checked={value.conditions.includes(option)}
                                onCheckedChange={(checked) =>
                                    toggleOption(option, checked === true)
                                }
                                disabled={disabled}
                            />
                            <span className="text-sm font-medium text-emerald-900">{option}</span>
                        </label>
                    );
                })}
            </div>
            <div className="space-y-2">
                <Label
                    htmlFor={`${idPrefix}-other`}
                    className="text-sm font-medium text-emerald-900"
                >
                    Others
                </Label>
                <Input
                    id={`${idPrefix}-other`}
                    placeholder="Please specify"
                    value={value.other ?? ""}
                    onChange={(event) =>
                        onChange({
                            ...value,
                            other: event.target.value,
                        })
                    }
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
