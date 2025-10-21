import PatientLayout from "@/components/patient/patient-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientAppointmentsLoading() {
    return (
        <PatientLayout
            title="Appointments"
            description="Plan and manage your clinic visits — from booking a slot to tracking approvals and changes."
            actions={<Skeleton className="hidden h-9 w-60 rounded-2xl md:flex" />}
        >
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] 2xl:gap-8">
                <div className="space-y-6">
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                </div>
                            ))}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-green-50 bg-white/80 p-4"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                            <Skeleton className="h-8 w-24" />
                                            <Skeleton className="h-8 w-24" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-40 w-full rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="space-y-2 rounded-2xl border border-green-50 bg-white/80 p-4">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </PatientLayout>
    );
}
