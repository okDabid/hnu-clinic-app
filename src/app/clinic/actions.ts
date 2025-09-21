"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateClinicContact(formData: FormData) {
    const clinic_id = formData.get("clinic_id") as string;
    const slug = formData.get("slug") as string;
    const clinic_contactno = (formData.get("clinic_contactno") as string || "").trim();

    if (!clinic_id || !slug) return { error: "Missing identifiers." };
    if (!/^\d{11}$/.test(clinic_contactno)) {
        return { error: "Contact number must be 11 digits." };
    }

    await prisma.clinic.update({
        where: { clinic_id },
        data: { clinic_contactno },
    });

    revalidatePath(`/clinic/${slug}`);
    redirect(`/clinic/${slug}`);
}
