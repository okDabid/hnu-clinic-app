import { ClinicForm } from "@/components/clinic/ClinicForm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";

async function addClinic(formData: FormData) {
    "use server";

    const clinic_name = formData.get("clinic_name") as string;
    const clinic_location = formData.get("clinic_location") as string;
    const clinic_contactno = formData.get("clinic_contactno") as string;

    if (!/^\d{11}$/.test(clinic_contactno)) {
        throw new Error("Contact number must be 11 digits.");
    }

    const slug = clinic_name.toLowerCase().replace(/\s+/g, "-");
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.clinic.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    await prisma.clinic.create({
        data: { clinic_name, clinic_location, clinic_contactno, slug: uniqueSlug },
    });

    revalidatePath("/clinic");
    redirect("/clinic");
}

export default function CreateClinicPage() {
    return (
        <div>
            <ClinicForm action={addClinic} />
        </div>
    );
}
