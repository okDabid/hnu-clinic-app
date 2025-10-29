import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseClinicLoading() {
    return (
        <NurseLayout
            title="Clinic Management"
            description="Maintain clinic locations, contact information, and update details for campus services."
        >
            <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-10 w-32 rounded-xl" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-green-50 bg-white/80 p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-28" />
                                    </div>
                                    <div className="flex gap-3">
                                        <Skeleton className="h-9 w-24" />
                                        <Skeleton className="h-9 w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-64" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                        <Skeleton className="h-10 w-48 rounded-xl" />
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] xl:grid-cols-[minmax(0,400px)_1fr]">
                            <div className="rounded-2xl border border-green-100/80 bg-white/70 p-4 shadow-inner">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 28 }).map((_, idx) => (
                                            <Skeleton key={idx} className="h-9 w-full rounded-lg" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-5 w-60" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <div className="space-y-3">
                                    {Array.from({ length: 2 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-2xl border border-green-50 bg-white/90 p-4 shadow-sm"
                                        >
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-44" />
                                                <Skeleton className="h-4 w-36" />
                                                <Skeleton className="h-4 w-28" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
