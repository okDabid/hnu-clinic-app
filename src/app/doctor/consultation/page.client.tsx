"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
    type ComponentProps,
} from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle, Pencil } from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";

import {
    formatManilaISODate,
    formatTimeRange,
    manilaNow,
    toManilaDateString,
    toManilaTimeString,
} from "@/lib/time";
import { cn } from "@/lib/utils";

import DoctorConsultationLoading from "./loading";
import {
    normalizeConsultationSlots,
    type Availability,
    type CalendarSlotsResponse,
    type Clinic,
    type NormalizedSlotsPayload,
    type SlotsResponse,
} from "./types";

const MANILA_TIME_SUFFIX = "+08:00";

function toCalendarDate(value: string | null | undefined) {
    if (!value) return null;
    const normalized = value.includes("T") ? value : `${value}T12:00:00${MANILA_TIME_SUFFIX}`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonthKeyFromDate(date: Date): string {
    return date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
    });
}

function getMonthKeyFromISODate(value: string): string {
    return value.slice(0, 7);
}

function sortSlotsForDay(slots: Availability[]): Availability[] {
    return [...slots].sort((a, b) => {
        if (a.is_on_leave && !b.is_on_leave) return -1;
        if (!a.is_on_leave && b.is_on_leave) return 1;
        return a.available_timestart.localeCompare(b.available_timestart);
    });
}

export type DoctorConsultationPageClientProps = {
    initialSlots: NormalizedSlotsPayload;
    initialClinics: Clinic[];
    initialSlotsLoaded: boolean;
    initialClinicsLoaded: boolean;
};

export function DoctorConsultationPageClient({
    initialSlots,
    initialClinics,
    initialSlotsLoaded,
    initialClinicsLoaded,
}: DoctorConsultationPageClientProps) {
    const [loading, setLoading] = useState(false);
    const [savingDutyHours, setSavingDutyHours] = useState(false);
    const [slots, setSlots] = useState<Availability[]>(() => [...initialSlots.slots]);
    const [clinics, setClinics] = useState<Clinic[]>(() => [...initialClinics]);
    const [slotsLoaded, setSlotsLoaded] = useState(initialSlotsLoaded);
    const [clinicsLoaded, setClinicsLoaded] = useState(initialClinicsLoaded);
    const [totalSlots, setTotalSlots] = useState(initialSlots.total);
    const initialSelectedDate =
        initialSlots.slots.length > 0
            ? toManilaDateString(initialSlots.slots[0].available_date)
            : formatManilaISODate(new Date());
    const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
        toCalendarDate(initialSelectedDate) ?? new Date()
    );
    const [formData, setFormData] = useState({
        clinic_id: "",
        available_date: "",
        available_timestart: "",
        available_timeend: "",
        is_on_leave: false,
    });
    const [editingSlot, setEditingSlot] = useState<Availability | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [calendarExpanded, setCalendarExpanded] = useState(
        () => initialSlots.slots.length > 0
    );
    const [, startTransition] = useTransition();

    const [calendarCache, setCalendarCache] = useState<Record<string, Availability[]>>({});
    const calendarCacheRef = useRef<Record<string, Availability[]>>({});
    const [calendarLoadingKeys, setCalendarLoadingKeys] = useState<Record<string, boolean>>({});

    useEffect(() => {
        calendarCacheRef.current = calendarCache;
    }, [calendarCache]);

    const initializing = !(slotsLoaded && clinicsLoaded);

    const uniqueClinicCount = useMemo(
        () => new Set(slots.map((slot) => slot.clinic.clinic_name)).size,
        [slots]
    );

    const displayedMonthKey = useMemo(() => formatMonthKeyFromDate(calendarMonth), [calendarMonth]);
    const displayedMonthSlots = useMemo(
        () => calendarCache[displayedMonthKey] ?? [],
        [calendarCache, displayedMonthKey]
    );

    const displayedMonthSlotsByDate = useMemo(() => {
        const map = new Map<string, Availability[]>();
        for (const slot of displayedMonthSlots) {
            const dateKey = toManilaDateString(slot.available_date);
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(slot);
        }
        return map;
    }, [displayedMonthSlots]);

    const highlightedDates = useMemo(
        () =>
            Array.from(displayedMonthSlotsByDate.keys())
                .map((date) => toCalendarDate(date))
                .filter((date): date is Date => Boolean(date)),
        [displayedMonthSlotsByDate]
    );

    const calendarSelectedDate = useMemo(
        () => toCalendarDate(selectedDate) ?? undefined,
        [selectedDate]
    );
    const selectedDateMonthKey = useMemo(
        () => (selectedDate ? getMonthKeyFromISODate(selectedDate) : null),
        [selectedDate]
    );

    const selectedDateSlots = useMemo(() => {
        if (!selectedDate || !selectedDateMonthKey) return [];
        const monthSlots = calendarCache[selectedDateMonthKey] ?? [];
        const items = monthSlots.filter(
            (slot) => toManilaDateString(slot.available_date) === selectedDate
        );
        return sortSlotsForDay(items);
    }, [calendarCache, selectedDate, selectedDateMonthKey]);

    const selectedDayCounts = useMemo(() => {
        let active = 0;
        let onLeave = 0;
        for (const slot of selectedDateSlots) {
            if (slot.is_on_leave) {
                onLeave += 1;
            } else {
                active += 1;
            }
        }
        return { active, onLeave };
    }, [selectedDateSlots]);

    const todayKey = useMemo(() => formatManilaISODate(manilaNow()), []);

    const sortedSlots = useMemo(() => {
        const slotsWithDateKeys = slots.map((slot) => ({
            slot,
            dateKey: toManilaDateString(slot.available_date),
        }));

        return slotsWithDateKeys
            .sort((a, b) => {
                const byDate = a.dateKey.localeCompare(b.dateKey);
                if (byDate !== 0) {
                    return byDate;
                }
                return a.slot.available_timestart.localeCompare(b.slot.available_timestart);
            })
            .map((item) => item.slot);
    }, [slots]);

    const upcomingActiveSlots = useMemo(
        () =>
            sortedSlots
                .filter(
                    (slot) =>
                        !slot.is_on_leave && toManilaDateString(slot.available_date) >= todayKey
                )
                .slice(0, 5),
        [sortedSlots, todayKey]
    );

    const upcomingLeaveSlots = useMemo(
        () =>
            sortedSlots
                .filter(
                    (slot) =>
                        slot.is_on_leave && toManilaDateString(slot.available_date) >= todayKey
                )
                .slice(0, 4),
        [sortedSlots, todayKey]
    );

    const selectedMonthLoading = selectedDateMonthKey
        ? calendarLoadingKeys[selectedDateMonthKey] ?? false
        : false;

    const displayedMonthLoading = calendarLoadingKeys[displayedMonthKey] ?? false;

    const displayedMonthStats = useMemo(() => {
        let active = 0;
        let onLeave = 0;
        const activeDays = new Set<string>();
        const leaveDays = new Set<string>();
        const coveredDays = new Set<string>();

        for (const slot of displayedMonthSlots) {
            const dateKey = toManilaDateString(slot.available_date);
            coveredDays.add(dateKey);
            if (slot.is_on_leave) {
                onLeave += 1;
                leaveDays.add(dateKey);
            } else {
                active += 1;
                activeDays.add(dateKey);
            }
        }

        return {
            active,
            onLeave,
            activeDays: activeDays.size,
            leaveDays: leaveDays.size,
            coveredDays: coveredDays.size,
        };
    }, [displayedMonthSlots]);

    const selectedDateLabel = useMemo(() => {
        if (!calendarSelectedDate) return "Select a day";
        return calendarSelectedDate.toLocaleDateString("en-PH", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Manila",
        });
    }, [calendarSelectedDate]);

    const selectedDateSummary = useMemo(() => {
        if (selectedDateSlots.length > 0) {
            const activeCount = selectedDayCounts.active;
            const onLeaveCount = selectedDayCounts.onLeave;

            if (activeCount > 0 && onLeaveCount > 0) {
                return `You have ${activeCount} active duty hour${activeCount === 1 ? "" : "s"
                    } and ${onLeaveCount} marked on leave for this day.`;
            }

            if (activeCount > 0) {
                return `You have ${activeCount} duty hour${activeCount === 1 ? "" : "s"} scheduled.`;
            }

            if (onLeaveCount > 0) {
                return "This day is marked as on leave. Patients will not see any available slots.";
            }
        }

        if (selectedMonthLoading) {
            return "Loading duty hours for this day...";
        }

        if (totalSlots === 0) {
            return "Generate duty hours to start populating your calendar.";
        }

        return "No duty hours plotted for this day yet.";
    }, [selectedDateSlots, selectedDayCounts, selectedMonthLoading, totalSlots]);

    const DayButtonWithSlots = useCallback(
        (props: ComponentProps<typeof CalendarDayButton>) => {
            const dateKey = formatManilaISODate(props.day.date);
            const entries = displayedMonthSlotsByDate.get(dateKey) ?? [];
            const activeCount = entries.filter((slot) => !slot.is_on_leave).length;
            const onLeave = entries.length > 0 && activeCount === 0;

            return (
                <CalendarDayButton
                    {...props}
                    className={cn(
                        props.className,
                        "transition-colors",
                        onLeave
                            ? "data-[selected-single=true]:bg-amber-500 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-amber-600"
                            : "data-[selected-single=true]:bg-emerald-700 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-emerald-700"
                    )}
                    title={
                        onLeave
                            ? "On leave"
                            : activeCount > 0
                                ? `${activeCount} slot${activeCount === 1 ? "" : "s"}`
                                : "No duty hours"
                    }
                >
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                        <span className="text-sm font-semibold leading-none sm:text-base">
                            {props.children}
                        </span>
                        <div className="flex items-center gap-1">
                            {activeCount > 0 ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                            ) : null}
                            {onLeave ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                            ) : null}
                        </div>
                    </div>
                </CalendarDayButton>
            );
        },
        [displayedMonthSlotsByDate]
    );

    const renderSlotCard = (slot: Availability, context: "card" | "inline") => (
        <div
            key={slot.availability_id}
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
                    slot.is_on_leave &&
                    "border-amber-300 text-amber-800 hover:bg-amber-100/80",
                    context === "inline" && "bg-white/90"
                )}
                onClick={() => {
                    const slotDate = toManilaDateString(slot.available_date);
                    setSelectedDate(slotDate);
                    setCalendarExpanded(true);
                    setEditingSlot(slot);
                    setFormData({
                        clinic_id: slot.clinic.clinic_id,
                        available_date: slotDate,
                        available_timestart: toManilaTimeString(slot.available_timestart),
                        available_timeend: toManilaTimeString(slot.available_timeend),
                        is_on_leave: slot.is_on_leave,
                    });
                    setDialogOpen(true);
                }}
            >
                <Pencil className="h-4 w-4" /> {slot.is_on_leave ? "Update" : "Edit"}
            </Button>
        </div>
    );
    const loadSlots = useCallback(async () => {
        try {
            setLoading(true);
            const aggregatedSlots: Availability[] = [];
            let combinedTotal = 0;
            let page = 1;
            let totalPages = 1;

            while (page <= totalPages) {
                const res = await fetch(`/api/doctor/consultation?page=${page}&pageSize=100`, {
                    cache: "no-store",
                });
                const data: SlotsResponse = await res.json();

                if (data.error) {
                    toast.error(data.error);
                    startTransition(() => {
                        setSlots([]);
                        setTotalSlots(0);
                        setSlotsLoaded(true);
                    });
                    return;
                }

                const normalized = normalizeConsultationSlots(data, page);
                aggregatedSlots.push(...normalized.slots);
                combinedTotal = normalized.total;
                totalPages = normalized.totalPages;

                if (!Array.isArray(data.data) || data.data.length === 0) {
                    break;
                }

                page += 1;
            }

            const nextTotal = combinedTotal > 0 ? combinedTotal : aggregatedSlots.length;

            startTransition(() => {
                setSlots([...aggregatedSlots]);
                setTotalSlots(nextTotal);
                setSlotsLoaded(true);
            });
        } catch {
            toast.error("Failed to load consultation slots");
        } finally {
            setLoading(false);
            setSlotsLoaded(true);
        }
    }, [startTransition]);

    const fetchCalendarMonth = useCallback(
        async (date: Date, options: { force?: boolean } = {}) => {
            const monthKey = formatMonthKeyFromDate(date);
            if (!options.force && calendarCacheRef.current[monthKey]) {
                return;
            }

            setCalendarLoadingKeys((prev) => ({ ...prev, [monthKey]: true }));

            try {
                const params = new URLSearchParams({ view: "calendar", month: monthKey });
                const res = await fetch(`/api/doctor/consultation?${params.toString()}`, {
                    cache: "no-store",
                });
                const data: CalendarSlotsResponse = await res.json();
                if (!res.ok || data.error) {
                    toast.error(data.error ?? "Failed to load calendar data");
                    return;
                }

                const slotsForMonth = Array.isArray(data.slots) ? data.slots : [];

                startTransition(() => {
                    setCalendarCache((prev) => {
                        const next = { ...prev, [monthKey]: slotsForMonth };
                        calendarCacheRef.current = next;
                        return next;
                    });
                });
            } catch {
                toast.error("Failed to load calendar data");
            } finally {
                setCalendarLoadingKeys((prev) => ({ ...prev, [monthKey]: false }));
            }
        },
        [startTransition]
    );

    const loadClinics = useCallback(async () => {
        try {
            const res = await fetch("/api/meta/clinics", { cache: "no-store" });
            const data = await res.json();
            if (!data.error) setClinics(data);
        } catch {
            console.warn("Failed to fetch clinics list");
        } finally {
            setClinicsLoaded(true);
        }
    }, []);

    const handleGoToToday = useCallback(() => {
        const now = new Date();
        const isoToday = formatManilaISODate(now);
        setSelectedDate(isoToday);
        setCalendarExpanded(true);
        const next = toCalendarDate(isoToday);
        if (next) {
            setCalendarMonth(next);
        }
    }, []);

    useEffect(() => {
        if (!slotsLoaded) {
            void loadSlots();
        }
    }, [slotsLoaded, loadSlots]);

    useEffect(() => {
        if (!clinicsLoaded) {
            void loadClinics();
        }
    }, [clinicsLoaded, loadClinics]);

    useEffect(() => {
        void fetchCalendarMonth(calendarMonth);
    }, [calendarMonth, fetchCalendarMonth]);

    useEffect(() => {
        const date = toCalendarDate(selectedDate);
        if (date) {
            void fetchCalendarMonth(date);
        }
    }, [selectedDate, fetchCalendarMonth]);

    useEffect(() => {
        if (!selectedDate) return;
        const monthKey = getMonthKeyFromISODate(selectedDate);
        const monthSlots = calendarCache[monthKey];
        if (monthSlots && monthSlots.some((slot) => toManilaDateString(slot.available_date) === selectedDate)) {
            return;
        }

        if (slots.length === 0) return;
        const selectionExists = slots.some(
            (slot) => toManilaDateString(slot.available_date) === selectedDate
        );
        if (!selectionExists) {
            const firstSlotDate = toManilaDateString(slots[0].available_date);
            setSelectedDate(firstSlotDate);
            setCalendarExpanded(true);
        }
    }, [calendarCache, slots, selectedDate]);

    useEffect(() => {
        if (!selectedDate) return;
        const nextMonth = toCalendarDate(selectedDate);
        if (!nextMonth) return;
        setCalendarMonth((prev) => {
            if (
                prev.getFullYear() === nextMonth.getFullYear() &&
                prev.getMonth() === nextMonth.getMonth()
            ) {
                return prev;
            }
            return nextMonth;
        });
    }, [selectedDate]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const isEditing = Boolean(editingSlot);

        if (isEditing) {
            if (
                !formData.available_date ||
                (!formData.is_on_leave && (!formData.available_timestart || !formData.available_timeend))
            ) {
                toast.error("Please provide both start and end times.");
                return;
            }
        } else {
            if (!formData.clinic_id || !formData.available_timestart || !formData.available_timeend) {
                toast.error("Clinic, start time, and end time are required.");
                return;
            }
        }

        const body = isEditing
            ? {
                availability_id: editingSlot!.availability_id,
                clinic_id: formData.clinic_id,
                available_date: formData.available_date,
                available_timestart: formData.available_timestart,
                available_timeend: formData.available_timeend,
                is_on_leave: formData.is_on_leave,
            }
            : {
                clinic_id: formData.clinic_id,
                available_timestart: formData.available_timestart,
                available_timeend: formData.available_timeend,
            };
        const method = isEditing ? "PUT" : "POST";

        try {
            setSavingDutyHours(true);
            setLoading(true);
            const res = await fetch("/api/doctor/consultation", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                toast.error(data.error ?? "Failed to save duty hours");
            } else {
                if (isEditing) {
                    toast.success("Schedule updated!");
                    await loadSlots();
                } else {
                    toast.success(data.message ?? "Duty hours generated!");
                    await loadSlots();
                }

                if (isEditing) {
                    const targetISODate = formData.available_date || selectedDate;
                    const target = toCalendarDate(targetISODate);
                    await fetchCalendarMonth(target ?? calendarMonth, { force: true });
                } else {
                    calendarCacheRef.current = {};
                    setCalendarCache({});
                    setCalendarLoadingKeys({});
                    await fetchCalendarMonth(calendarMonth, { force: true });
                }

                setDialogOpen(false);
                setFormData({
                    clinic_id: "",
                    available_date: "",
                    available_timestart: "",
                    available_timeend: "",
                    is_on_leave: false,
                });
                setEditingSlot(null);
            }
        } catch {
            toast.error("Failed to save duty hours");
        } finally {
            setLoading(false);
            setSavingDutyHours(false);
        }
    }

    if (initializing) {
        return <DoctorConsultationLoading />;
    }
    return (
        <DoctorLayout
            title="Consultation availability"
            description="Manage your duty hours, adjust clinic assignments, and publish new consultation slots."
        >
            <div className="space-y-6">
                {/* Consultation Section */}
                <section className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6">
                    <Card className="rounded-3xl border border-green-100/70 bg-linear-to-r from-green-100/70 via-white to-green-50/80 shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base font-semibold text-green-700">
                                Availability overview
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {totalSlots === 0
                                    ? "No active slots yet. Generate duty hours to publish a new schedule."
                                    : `Your calendar tracks ${totalSlots} availability ${totalSlots === 1 ? "entry" : "entries"
                                    }. This view is showing ${slots.length} entr${slots.length === 1 ? "y" : "ies"
                                    } across ${uniqueClinicCount} clinic${uniqueClinicCount === 1 ? "" : "s"
                                    }.`}
                            </p>
                        </CardHeader>
                    </Card>
                    <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="flex flex-col gap-3 border-b border-green-100/70 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-xl font-semibold text-green-700 sm:text-2xl">
                                    My duty hours
                                </CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Plot and edit your clinic schedule directly from the calendar. Toggle on-leave days without deleting existing hours.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/80"
                                    onClick={handleGoToToday}
                                >
                                    Jump to today
                                </Button>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                                            onClick={() => {
                                                setEditingSlot(null);
                                                setFormData({
                                                    clinic_id: "",
                                                    available_date: "",
                                                    available_timestart: "",
                                                    available_timeend: "",
                                                    is_on_leave: false,
                                                });
                                            }}
                                        >
                                            <PlusCircle className="h-4 w-4" /> Set duty hours
                                        </Button>
                                    </DialogTrigger>

                                    {dialogOpen ? (
                                        <DialogContent className="rounded-3xl border border-green-100 bg-white/95">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg font-semibold text-green-700">
                                                    {editingSlot ? "Edit consultation slot" : "Generate duty hours"}
                                                </DialogTitle>
                                                <DialogDescription className="text-sm text-muted-foreground">
                                                    {editingSlot
                                                        ? "Update the start or end time for this specific day."
                                                        : "Set your daily duty hours and we will populate the upcoming schedule automatically."}
                                                </DialogDescription>
                                                {!editingSlot && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Duty hours will be plotted on working days (Mon–Fri for physicians, Mon–Sat for dentists) from this month through the rest of the year.
                                                    </p>
                                                )}
                                            </DialogHeader>

                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <Label>Clinic</Label>
                                                    <select
                                                        value={formData.clinic_id}
                                                        onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                                                        required
                                                        className="w-full rounded-md border p-2"
                                                        disabled={loading}
                                                    >
                                                        <option value="">Select clinic</option>
                                                        {clinics.map((c) => (
                                                            <option key={c.clinic_id} value={c.clinic_id}>
                                                                {c.clinic_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {editingSlot && (
                                                    <div>
                                                        <Label>Date</Label>
                                                        <Input type="date" value={formData.available_date} disabled readOnly />
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <Label>Start Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={formData.available_timestart}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, available_timestart: e.target.value })
                                                            }
                                                            required
                                                            disabled={loading || (editingSlot ? formData.is_on_leave : false)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>End Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={formData.available_timeend}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, available_timeend: e.target.value })
                                                            }
                                                            required
                                                            disabled={loading || (editingSlot ? formData.is_on_leave : false)}
                                                        />
                                                    </div>
                                                </div>

                                                {editingSlot && (
                                                    <div className="rounded-2xl border border-green-100/80 bg-emerald-50/40 p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-semibold text-green-700">
                                                                    Availability status
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Toggle on leave to block patient appointments for this day without deleting the original schedule.
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                checked={formData.is_on_leave}
                                                                onCheckedChange={(checked) =>
                                                                    setFormData({ ...formData, is_on_leave: checked })
                                                                }
                                                                disabled={loading}
                                                                aria-label="Toggle on leave status"
                                                            />
                                                        </div>
                                                        {formData.is_on_leave && (
                                                            <p className="mt-2 text-sm text-amber-700">
                                                                Patients will see this date as unavailable while it is on leave.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <DialogFooter>
                                                    <Button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                                                    >
                                                        {savingDutyHours && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                                                        {savingDutyHours
                                                            ? editingSlot
                                                                ? "Saving..."
                                                                : "Generating..."
                                                            : editingSlot
                                                                ? "Save Changes"
                                                                : "Generate"}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    ) : null}
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-6 pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" /> Loading slots...
                                </div>
                            ) : (
                                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                                    <div className="space-y-4">
                                        <div className="rounded-3xl border border-green-100/80 bg-linear-to-br from-emerald-50/60 via-white to-emerald-100/60 p-5 shadow-sm sm:p-6">
                                            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                                                        Monthly snapshot
                                                    </p>
                                                    <p>
                                                        {displayedMonthStats.coveredDays > 0
                                                            ? `${displayedMonthStats.coveredDays} day${displayedMonthStats.coveredDays === 1 ? "" : "s"
                                                            } plotted this month.`
                                                            : "No duty hours plotted this month yet."}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                    <Badge className="rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                                                        {displayedMonthStats.active} active slot{displayedMonthStats.active === 1 ? "" : "s"}
                                                    </Badge>
                                                    <Badge className="rounded-full border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700">
                                                        {displayedMonthStats.onLeave} on leave
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="relative mt-4 rounded-2xl border border-green-100/60 bg-white/70 shadow-inner">
                                                {displayedMonthLoading ? (
                                                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                                                        <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                                                    </div>
                                                ) : null}
                                                <div className="overflow-x-auto px-3 py-3 sm:px-4 sm:py-4">
                                                    <Calendar
                                                        mode="single"
                                                        selected={calendarSelectedDate}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                const next = formatManilaISODate(date);
                                                                setSelectedDate(next);
                                                                setCalendarExpanded(true);
                                                            }
                                                        }}
                                                        month={calendarMonth}
                                                        onMonthChange={setCalendarMonth}
                                                        components={{ DayButton: DayButtonWithSlots }}
                                                        modifiers={{ hasSlots: highlightedDates }}
                                                        className="mx-auto w-full max-w-sm sm:max-w-none [--cell-size:2.3rem] sm:[--cell-size:2.75rem] xl:[--cell-size:3.25rem]"
                                                    />
                                                </div>
                                            </div>
                                            <Collapsible
                                                open={calendarExpanded}
                                                onOpenChange={setCalendarExpanded}
                                            >
                                                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-green-100/80 bg-white/80 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                                                            {calendarExpanded ? "Selected day" : "Day details"}
                                                        </p>
                                                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                                                            {selectedDateLabel}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {selectedDateSummary}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-start gap-2 sm:items-end">
                                                        {selectedDateSlots.length > 0 ? (
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Badge className="rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                                                                    {selectedDayCounts.active} active
                                                                </Badge>
                                                                {selectedDayCounts.onLeave > 0 ? (
                                                                    <Badge className="rounded-full border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700">
                                                                        {selectedDayCounts.onLeave} on leave
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="rounded-full text-green-700 hover:bg-emerald-100"
                                                            >
                                                                {calendarExpanded ? "Collapse" : "View schedule"}
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    </div>
                                                </div>
                                                <CollapsibleContent className="grid data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
                                                    <div className="mt-3 overflow-hidden">
                                                        {selectedDateSlots.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {selectedDateSlots.map((slot) => renderSlotCard(slot, "inline"))}
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/40 p-5 text-sm text-muted-foreground">
                                                                {totalSlots === 0 ? (
                                                                    <>No consultation duty hours yet. Use “Set duty hours” to generate your schedule.</>
                                                                ) : (
                                                                    <>No duty hours plotted for {selectedDateLabel}. Choose another day or edit existing hours.</>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                    <span>Active slots</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                    <span>On leave</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full border border-border bg-white" />
                                                    <span>No duty hours</span>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                Select a day to review or edit consultation duty hours.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 xl:space-y-5">
                                        <div className="rounded-3xl border border-green-100/70 bg-linear-to-br from-white via-emerald-50/60 to-emerald-100/60 p-5 shadow-inner">
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                                                    Upcoming duty hours
                                                </p>
                                                <h3 className="text-base font-semibold text-slate-900">
                                                    Your next clinic commitments
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Stay ahead by reviewing the next few confirmed duty hours across your clinics.
                                                </p>
                                            </div>
                                            {upcomingActiveSlots.length > 0 ? (
                                                <div className="mt-4 space-y-3">
                                                    {upcomingActiveSlots.map((slot) => renderSlotCard(slot, "card"))}
                                                </div>
                                            ) : (
                                                <div className="mt-4 rounded-2xl border border-dashed border-green-200 bg-emerald-50/40 p-4 text-sm text-muted-foreground">
                                                    No upcoming duty hours are scheduled beyond today. Generate new hours to publish availability.
                                                </div>
                                            )}
                                        </div>
                                        <div className="rounded-3xl border border-amber-100/70 bg-linear-to-br from-amber-50/70 via-white to-amber-100/70 p-5 shadow-inner">
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                                                    On leave days
                                                </p>
                                                <h3 className="text-base font-semibold text-amber-900">
                                                    Planned time away
                                                </h3>
                                                <p className="text-sm text-amber-800/80">
                                                    Patients will not see these slots until you restore availability.
                                                </p>
                                            </div>
                                            {upcomingLeaveSlots.length > 0 ? (
                                                <div className="mt-4 space-y-3">
                                                    {upcomingLeaveSlots.map((slot) => (
                                                        <div
                                                            key={slot.availability_id}
                                                            className="rounded-2xl border border-amber-200 bg-white/80 p-4 text-sm text-amber-900 shadow-sm"
                                                        >
                                                            <p className="text-sm font-semibold text-amber-800">
                                                                {toManilaDateString(slot.available_date)} · {formatTimeRange(slot.available_timestart, slot.available_timeend)}
                                                            </p>
                                                            <p className="mt-1 text-sm text-amber-800/80">
                                                                {slot.clinic.clinic_name}
                                                            </p>
                                                            <p className="mt-2 text-xs text-amber-700">
                                                                Update this day to reopen appointments if plans change.
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-4 text-sm text-amber-800/80">
                                                    No upcoming leave days on record. Use “Edit” on a duty hour to temporarily block bookings.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

            </div>
        </DoctorLayout>
    );
}

export default DoctorConsultationPageClient;
