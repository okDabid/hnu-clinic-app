import ScholarLayout from "@/components/scholar/scholar-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScholarAppointmentsLoading() {
    return (
        <ScholarLayout
            title="Appointment coordination"
            description="Track campus clinic bookings, monitor status changes, and keep students informed about their schedules."
            actions={<Skeleton className="h-10 w-32 rounded-xl" />}
        >
            <div className="flex flex-col gap-6">
                <section className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card
                            key={index}
                            className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm"
                        >
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-4 w-3/5" />
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-3 w-32 rounded-full" />
                            ))}
                        </div>
                        <div className="rounded-2xl border border-green-100 p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-wrap gap-3">
                                    <Skeleton className="h-10 w-48" />
                                    <Skeleton className="h-10 w-32" />
                                    <Skeleton className="h-10 w-36" />
                                </div>
                                <div className="flex gap-3">
                                    <Skeleton className="h-10 w-28" />
                                    <Skeleton className="h-10 w-28" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-green-50 bg-white/80 p-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-col gap-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                            <Skeleton className="h-8 w-28" />
                                            <Skeleton className="h-8 w-28" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScholarLayout>
    );
}
