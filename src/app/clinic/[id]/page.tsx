// app/clinic-locations/[id]/page.tsx

import prisma from "@/lib/db";
import { notFound } from "next/navigation";

interface ClinicDetailProps {
    params: { id: string };
}

export default async function ClinicDetail({ params }: ClinicDetailProps) {
    const clinic = await prisma.clinic.findUnique({
        where: {
            clinic_id: params.id,
        },
    });

    if (!clinic) {
        notFound();
    }

    return (
        <main className="p-6">
            <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6">
                <h1 className="text-2xl font-bold text-blue-600 mb-4">
                    {clinic.clinic_name}
                </h1>

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
