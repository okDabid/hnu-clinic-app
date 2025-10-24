import DoctorLayout from "@/components/doctor/doctor-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorConsultationLoading() {
    return (
        <DoctorLayout
            title="Consultation availability"
            description="Manage your duty hours, adjust clinic assignments, and publish new consultation slots."
        >
            <div className="space-y-6">
                <section className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6">
                    <Card className="rounded-3xl border border-green-100/70 bg-linear-to-r from-green-100/70 via-white to-green-50/80 shadow-sm">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                    </Card>

                    <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="flex flex-col gap-3 border-b border-green-100/70 sm:flex-row sm:items-center sm:justify-between">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-10 w-40 rounded-xl" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="rounded-2xl border border-green-50 bg-white/80 p-4">
                                        <Skeleton className="mb-3 h-4 w-24" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-28" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6">
                    <Card className="rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="border-b border-green-100/70 pb-4">
                            <Skeleton className="h-5 w-1/3" />
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Skeleton className="h-10 w-28" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </DoctorLayout>
    );
}
