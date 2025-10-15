import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const BLOOD_TYPES = [
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
    "O_POS",
    "O_NEG",
] as const;

export const patientRecordPatchSchema = z.object({
    type: z.enum(["Student", "Employee"]),
    contactno: z.string().optional(),
    address: z.string().optional(),
    bloodtype: z.enum(BLOOD_TYPES).nullable().optional(),
    allergies: z.string().optional(),
    medical_cond: z.string().optional(),
    emergency: z
        .object({
            name: z.string().optional(),
            num: z.string().optional(),
            relation: z.string().optional(),
        })
        .optional(),
});

export type PatientRecordPatchInput = z.infer<typeof patientRecordPatchSchema>;

export async function updatePatientRecordEntry(id: string, input: PatientRecordPatchInput) {
    const { type, ...data } = input;

    const commonData = {
        contactno: data.contactno ?? undefined,
        address: data.address ?? undefined,
        bloodtype: data.bloodtype !== undefined ? { set: data.bloodtype } : undefined,
        allergies: data.allergies ?? undefined,
        medical_cond: data.medical_cond ?? undefined,
        emergencyco_name: data.emergency?.name ?? undefined,
        emergencyco_num: data.emergency?.num ?? undefined,
        emergencyco_relation: data.emergency?.relation ?? undefined,
    };

    if (type === "Student") {
        return prisma.student.update({
            where: { stud_user_id: id },
            data: commonData,
        });
    }

    if (type === "Employee") {
        return prisma.employee.update({
            where: { emp_id: id },
            data: commonData,
        });
    }

    throw new Error("Unsupported patient type");
}