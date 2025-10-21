import DoctorLayout from "@/components/doctor/doctor-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorDispenseLoading() {
    return (
        <DoctorLayout
            title="Dispensing log"
            description="Document issued medicines, validate stock balances, and maintain accurate clinic records."
            actions={<Skeleton className="h-10 w-28 rounded-xl" />}
        >
            <div className="space-y-6">
                <section className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6">
                    <Card className="rounded-3xl border border-green-100/70 bg-gradient-to-r from-green-100/70 via-white to-green-50/80 shadow-sm">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                    </Card>
                    <Card className="rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="space-y-2 border-b border-green-100/70">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-[90px] w-full rounded-xl" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="mx-auto w-full max-w-6xl space-y-4 px-4 sm:px-6">
                    <Card className="rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="space-y-2 border-b border-green-100/70">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-green-50 bg-white/80 p-4"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-36" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                            <Skeleton className="h-8 w-24" />
                                            <Skeleton className="h-8 w-28" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </DoctorLayout>
    );
}
