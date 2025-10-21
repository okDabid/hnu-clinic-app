import PatientLayout from "@/components/patient/patient-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientNotificationLoading() {
    return (
        <PatientLayout
            title="Notification center"
            description="Stay on top of appointment approvals, updates, and reminders for your clinic visits."
            actions={<Skeleton className="hidden h-8 w-40 rounded-xl md:flex" />}
        >
            <div className="space-y-8">
                <Card className="rounded-3xl border-green-100/80 bg-gradient-to-r from-green-100/80 via-white to-green-50/80 shadow-sm">
                    <CardHeader className="space-y-2 text-center">
                        <Skeleton className="mx-auto h-8 w-64" />
                        <Skeleton className="mx-auto h-4 w-72" />
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-green-700">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-6 w-32 rounded-full" />
                        ))}
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card
                            key={index}
                            className="h-full rounded-3xl border-green-100/70 bg-white/90 shadow-sm"
                        >
                            <CardHeader className="flex flex-col items-start gap-3">
                                <Skeleton className="h-10 w-10 rounded-2xl" />
                                <Skeleton className="h-5 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="rounded-2xl border border-green-50 bg-white/80 p-4">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
