import PatientLayout from "@/components/patient/patient-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientAccountLoading() {
    return (
        <PatientLayout
            title="Loading profile"
            description="Please wait while we retrieve your account data."
            actions={<Skeleton className="hidden h-8 w-36 rounded-xl md:block" />}
        >
            <div className="space-y-6">
                <Card className="rounded-3xl border-green-100/80 bg-white/90 p-8 text-center shadow-sm">
                    <div className="flex flex-col items-center gap-3 text-green-700">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </Card>

                <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <Skeleton className="h-10 w-28" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
