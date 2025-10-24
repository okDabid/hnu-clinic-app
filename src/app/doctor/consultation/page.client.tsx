"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useTransition,
    type ComponentProps,
} from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle, Pencil } from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import {
    formatManilaISODate,
    formatTimeRange,
    toManilaDateString,
    toManilaTimeString,
} from "@/lib/time";
import { cn } from "@/lib/utils";

import DoctorConsultationLoading from "./loading";
import {
    DEFAULT_PAGE_SIZE,
    normalizeConsultationSlots,
    type Availability,
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
    const [currentPage, setCurrentPage] = useState(initialSlots.page);
    const [totalSlots, setTotalSlots] = useState(initialSlots.total);
    const [totalPages, setTotalPages] = useState(initialSlots.totalPages);
    const [pageSize, setPageSize] = useState(initialSlots.pageSize || DEFAULT_PAGE_SIZE);
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
    });
    const [editingSlot, setEditingSlot] = useState<Availability | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isTransitioning, startTransition] = useTransition();

    const initializing = !(slotsLoaded && clinicsLoaded);

    const uniqueClinicCount = useMemo(
        () => new Set(slots.map((slot) => slot.clinic.clinic_name)).size,
        [slots]
    );

    const loadSlots = useCallback(
        async (targetPage: number) => {
            try {
                setLoading(true);
                const res = await fetch(
                    `/api/doctor/consultation?page=${targetPage}&pageSize=${pageSize}`,
                    { cache: "no-store" }
                );
                const data: SlotsResponse = await res.json();
                if (data.error) {
                    toast.error(data.error);
                    startTransition(() => {
                        setSlots([]);
                        setTotalSlots(0);
                        setTotalPages(1);
                        setCurrentPage(1);
                        setPageSize(DEFAULT_PAGE_SIZE);
                    });
                    return;
                }

                const normalized = normalizeConsultationSlots(data, targetPage);

                startTransition(() => {
                    setSlots([...normalized.slots]);
                    setTotalSlots(normalized.total);
                    setTotalPages(normalized.totalPages);
                    setCurrentPage(normalized.page);
                    setPageSize(normalized.pageSize);
                    setSlotsLoaded(true);
                });
            } catch {
                toast.error("Failed to load consultation slots");
            } finally {
                setLoading(false);
                setSlotsLoaded(true);
            }
        },
        [pageSize, startTransition]
    );

    const slotsByDate = useMemo(() => {
        const map = new Map<string, Availability[]>();
        for (const slot of slots) {
            const dateKey = toManilaDateString(slot.available_date);
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(slot);
        }
        return map;
    }, [slots]);

    const selectedDateSlots = useMemo(() => {
        if (!selectedDate) return [];
        const items = slotsByDate.get(selectedDate) ?? [];
        return [...items].sort((a, b) => a.available_timestart.localeCompare(b.available_timestart));
    }, [selectedDate, slotsByDate]);

    const highlightedDates = useMemo(
        () =>
            Array.from(slotsByDate.keys())
                .map((date) => toCalendarDate(date))
                .filter((date): date is Date => Boolean(date)),
        [slotsByDate]
    );

    const calendarSelectedDate = useMemo(
        () => toCalendarDate(selectedDate) ?? undefined,
        [selectedDate]
    );

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
            return `You have ${selectedDateSlots.length} duty hour${
                selectedDateSlots.length === 1 ? "" : "s"
            } scheduled.`;
        }
        if (totalSlots === 0) {
            return "Generate duty hours to start populating your calendar.";
        }
        return "No duty hours plotted for this day yet.";
    }, [selectedDateSlots.length, totalSlots]);

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const DayButtonWithSlots = useCallback(
        (props: ComponentProps<typeof CalendarDayButton>) => {
            const dateKey = formatManilaISODate(props.day.date);
            const count = slotsByDate.get(dateKey)?.length ?? 0;

            return (
                <CalendarDayButton
                    {...props}
                    className={cn(
                        props.className,
                        "transition-colors",
                        "data-[selected=true]:bg-green-600 data-[selected=true]:text-white data-[selected=true]:hover:bg-green-600",
                        count > 0
                            ? "data-[selected=false]:border data-[selected=false]:border-green-200 data-[selected=false]:bg-emerald-50 data-[selected=false]:text-green-700 hover:data-[selected=false]:bg-emerald-100"
                            : "hover:data-[selected=false]:bg-muted"
                    )}
                >
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                        <span className="text-base font-semibold leading-none">{props.children}</span>
                        {count > 0 ? (
                            <span className="rounded-full bg-green-100 px-2 text-[0.625rem] font-semibold leading-5 text-green-700">
                                {count} slot{count === 1 ? "" : "s"}
                            </span>
                        ) : (
                            <span className="text-[0.625rem] text-muted-foreground">&nbsp;</span>
                        )}
                    </div>
                </CalendarDayButton>
            );
        },
        [slotsByDate]
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

    useEffect(() => {
        if (!slotsLoaded) {
            void loadSlots(1);
        }
    }, [slotsLoaded, loadSlots]);

    useEffect(() => {
        if (!clinicsLoaded) {
            void loadClinics();
        }
    }, [clinicsLoaded, loadClinics]);

    useEffect(() => {
        if (slots.length === 0) return;
        const selectionExists =
            selectedDate &&
            slots.some((slot) => toManilaDateString(slot.available_date) === selectedDate);
        if (!selectionExists) {
            const firstSlotDate = toManilaDateString(slots[0].available_date);
            setSelectedDate(firstSlotDate);
        }
    }, [slots, selectedDate]);

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
            if (!formData.available_date || !formData.available_timestart || !formData.available_timeend) {
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
                    await loadSlots(currentPage);
                } else {
                    toast.success(data.message ?? "Duty hours generated!");
                    await loadSlots(1);
                }
                setDialogOpen(false);
                setFormData({
                    clinic_id: "",
                    available_date: "",
                    available_timestart: "",
                    available_timeend: "",
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
                                    : `Your calendar tracks ${totalSlots} availability ${
                                          totalSlots === 1 ? "entry" : "entries"
                                      }. This page is showing ${slots.length} entr${
                                          slots.length === 1 ? "y" : "ies"
                                      } across ${uniqueClinicCount} clinic${
                                          uniqueClinicCount === 1 ? "" : "s"
                                      } (page ${currentPage} of ${totalPages}).`}
                            </p>
                        </CardHeader>
                    </Card>
                    <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="flex flex-col gap-3 border-b border-green-100/70 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-xl font-semibold text-green-700 sm:text-2xl">
                                My duty hours
                            </CardTitle>

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
                                                    className="w-full border rounded-md p-2"
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

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Start Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={formData.available_timestart}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, available_timestart: e.target.value })
                                                        }
                                                        required
                                                        disabled={loading}
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
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                                                >
                                                    {savingDutyHours && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
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
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col gap-6 pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" /> Loading slots...
                                </div>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                                    <div className="rounded-3xl border border-green-100/70 bg-white/90 p-4 shadow-sm">
                                        <Calendar
                                            mode="single"
                                            selected={calendarSelectedDate}
                                            onSelect={(date) => {
                                                if (date) {
                                                    const next = formatManilaISODate(date);
                                                    setSelectedDate(next);
                                                }
                                            }}
                                            month={calendarMonth}
                                            onMonthChange={setCalendarMonth}
                                            components={{ DayButton: DayButtonWithSlots }}
                                            modifiers={{ hasSlots: highlightedDates }}
                                            className="mx-auto [--cell-size:3.25rem]"
                                        />
                                        <p className="mt-4 text-sm text-muted-foreground">
                                            Select a day to review or edit consultation duty hours.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="rounded-3xl border border-green-100/70 bg-white p-6 shadow-sm">
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
                                                    Selected day
                                                </p>
                                                <h3 className="text-2xl font-semibold text-slate-900">
                                                    {selectedDateLabel}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{selectedDateSummary}</p>
                                            </div>
                                            <div className="mt-6 space-y-3">
                                                {selectedDateSlots.length > 0 ? (
                                                    selectedDateSlots.map((slot) => (
                                                        <div
                                                            key={slot.availability_id}
                                                            className="flex flex-col gap-3 rounded-2xl border border-green-100/80 bg-emerald-50/40 p-4 text-sm text-slate-700 shadow-inner sm:flex-row sm:items-center sm:justify-between"
                                                        >
                                                            <div>
                                                                <p className="text-lg font-semibold text-green-700">
                                                                    {formatTimeRange(
                                                                        slot.available_timestart,
                                                                        slot.available_timeend
                                                                    )}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {slot.clinic.clinic_name}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-2 rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                                                                onClick={() => {
                                                                    const slotDate = toManilaDateString(slot.available_date);
                                                                    setSelectedDate(slotDate);
                                                                    setEditingSlot(slot);
                                                                    setFormData({
                                                                        clinic_id: slot.clinic.clinic_id,
                                                                        available_date: slotDate,
                                                                        available_timestart: toManilaTimeString(
                                                                            slot.available_timestart
                                                                        ),
                                                                        available_timeend: toManilaTimeString(
                                                                            slot.available_timeend
                                                                        ),
                                                                    });
                                                                    setDialogOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" /> Edit
                                                            </Button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/30 p-6 text-sm text-muted-foreground">
                                                        {totalSlots === 0 ? (
                                                            <>No consultation duty hours yet. Use “Set duty hours” to generate your schedule.</>
                                                        ) : (
                                                            <>No duty hours plotted for {selectedDateLabel}. Choose another day or edit existing hours.</>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-3xl border border-green-100/70 bg-white p-4 shadow-sm">
                                            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                                <p>
                                                    Showing {slots.length} slot{slots.length === 1 ? "" : "s"} on this page across {uniqueClinicCount} clinic{uniqueClinicCount === 1 ? "" : "s"}. Page {currentPage} of {totalPages}.
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                                                        disabled={loading || isTransitioning || !canGoPrevious}
                                                        onClick={() => void loadSlots(currentPage - 1)}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                                                        disabled={loading || isTransitioning || !canGoNext}
                                                        onClick={() => void loadSlots(currentPage + 1)}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
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
