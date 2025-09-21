import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { ClinicDetailActions } from "./_components/clinic-detail-actions";

interface ClinicDetailProps {
    params: Promise<{ slug: string }>; // 👈 must be a Promise
}

export default async function ClinicDetail({ params }: ClinicDetailProps) {
    const { slug } = await params; // 👈 await the params

    const clinic = await prisma.clinic.findUnique({
        where: { slug },
    });

    if (!clinic) {
        notFound();
    }

    return (
        <main className="p-6">
            <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <h1 className="text-2xl font-bold text-green-600">
                        {clinic.clinic_name}
                    </h1>
                    <ClinicDetailActions
                        clinicId={clinic.clinic_id}
                        slug={clinic.slug}
                        currentNumber={clinic.clinic_contactno}
                    />
                </div>

                <div className="space-y-3 text-gray-700">
                    <p>
                        <span className="font-semibold">Location:</span>{" "}
                        {clinic.clinic_location}
                    </p>
                    <p>
                        <span className="font-semibold">Contact Number:</span>{" "}
                        {clinic.clinic_contactno}
                    </p>
                </div>
            </div>
        </main>
    );
}
