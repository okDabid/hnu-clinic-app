import DoctorLayout from "@/components/doctor/doctor-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorAccountLoading() {
    return (
        <DoctorLayout
            title="Account Management"
            description="Keep your clinic profile accurate, secure, and ready for seamless coordination."
        >
            <div className="mx-auto w-full max-w-4xl space-y-10">
                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </DoctorLayout>
    );
}
