import { memo } from "react";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimeRange, toManilaDateString, toManilaTimeString } from "@/lib/time";
import { cn } from "@/lib/utils";

import type { Availability } from "../types";

type SlotCardProps = {
    slot: Availability;
    context: "card" | "inline";
    onEdit?: (slot: Availability) => void;
};

function SlotCardComponent({ slot, context, onEdit }: SlotCardProps) {
    const handleEdit = () => {
        onEdit?.(slot);
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-2xl border p-4 text-sm shadow-inner sm:flex-row sm:items-center sm:justify-between",
                slot.is_on_leave
                    ? context === "inline"
                        ? "border-amber-200 bg-amber-50/80 text-amber-900"
                        : "border-amber-200 bg-amber-50/70 text-amber-900"
                    : context === "inline"
                        ? "border-green-100/80 bg-emerald-50/70 text-slate-700"
                        : "border-green-100/80 bg-emerald-50/40 text-slate-700",
                context === "inline" && "shadow-sm"
            )}
        >
            <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p
                        className={cn(
                            "text-lg font-semibold",
                            slot.is_on_leave ? "text-amber-800" : "text-green-700"
                        )}
                    >
                        {formatTimeRange(slot.available_timestart, slot.available_timeend)}
                    </p>
                    {slot.is_on_leave ? (
                        <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-100 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-800"
                        >
                            On leave
                        </Badge>
                    ) : null}
                </div>
                <p
                    className={cn(
                        "text-sm",
                        slot.is_on_leave ? "text-amber-700/90" : "text-muted-foreground"
                    )}
                >
                    {slot.clinic.clinic_name}
                </p>
                {slot.is_on_leave ? (
                    <p className="text-xs text-amber-700">
                        Patients cannot book appointments for this day until you restore availability.
                    </p>
                ) : null}
            </div>
            <Button
                size="sm"
                variant="outline"
                className={cn(
                    "w-full gap-2 rounded-xl border-green-200 text-green-700 hover:bg-green-100/70 sm:w-auto",
                    slot.is_on_leave && "border-amber-300 text-amber-800 hover:bg-amber-100/80",
                    context === "inline" && "bg-white/90"
                )}
                onClick={handleEdit}
            >
                <Pencil className="h-4 w-4" /> {slot.is_on_leave ? "Update" : "Edit"}
            </Button>
        </div>
    );
}

export const SlotCard = memo(SlotCardComponent);

export function buildFormStateFromSlot(slot: Availability) {
    const slotDate = toManilaDateString(slot.available_date);
    return {
        slotDate,
        formState: {
            clinic_id: slot.clinic.clinic_id,
            available_date: slotDate,
            available_timestart: toManilaTimeString(slot.available_timestart),
            available_timeend: toManilaTimeString(slot.available_timeend),
            is_on_leave: slot.is_on_leave,
        },
    } as const;
}
