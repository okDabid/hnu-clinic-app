// app/clinic-locations/page.tsx

import prisma from "@/lib/db";
import Link from "next/link";

export default async function ClinicLocations() {
    // Fetch all clinics
    const clinics = await prisma.clinic.findMany();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Clinic Locations</h1>
            <ul className="space-y-2">
                {clinics.map((clinic) => (
                    <li
                        key={clinic.clinic_id}
                        className="p-4 border rounded-lg shadow-sm bg-white hover:bg-gray-50"
                    >
                        <Link href={`/clinic/${clinic.clinic_id}`}>
                            <h2 className="text-lg font-semibold text-blue-600 hover:underline">
                                {clinic.clinic_name}
                            </h2>
                            <p className="text-gray-600">{clinic.clinic_location}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
