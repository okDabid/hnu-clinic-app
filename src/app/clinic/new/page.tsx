import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"; // ✅ import this

// Server Action to handle form submission
async function addClinic(formData: FormData) {
    "use server";

    const clinic_name = formData.get("clinic_name") as string;
    const clinic_location = formData.get("clinic_location") as string;
    const clinic_contactno = formData.get("clinic_contactno") as string;

    // Validate contact number
    if (!/^\d{11}$/.test(clinic_contactno)) {
        throw new Error("Contact number must be 11 digits.");
    }

    // Generate a slug (lowercase, replace spaces)
    const slug = clinic_name.toLowerCase().replace(/\s+/g, "-");

    // Ensure uniqueness by appending a counter if necessary
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.clinic.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    try {
        await prisma.clinic.create({
            data: {
                clinic_name,
                clinic_location,
                clinic_contactno,
                slug: uniqueSlug,
            },
        });

        // ✅ Bust cache so /clinic shows the new data immediately
        revalidatePath("/clinic");
    } catch (error: unknown) {
        console.error("Error creating clinic:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "Failed to create clinic. Please try again.");
        }
        throw new Error("Failed to create clinic. Please try again.");
    }

    redirect("/clinic"); // Go back to list after submit
}

export default function NewClinicPage() {
    return (
        <main className="p-6">
            <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-4">Add New Clinic</h1>

                <form action={addClinic} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Clinic Name
                        </label>
                        <input
                            type="text"
                            name="clinic_name"
                            required
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Location
                        </label>
                        <input
                            type="text"
                            name="clinic_location"
                            required
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Contact Number
                        </label>
                        <input
                            type="text"
                            name="clinic_contactno"
                            required
                            maxLength={11}
                            pattern="\d{11}"
                            title="Contact number must be 11 digits"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                        Add Clinic
                    </button>
                </form>
            </div>
        </main>
    );
}
