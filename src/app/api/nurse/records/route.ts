import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // 🧑‍🎓 Student patients
        const students = await prisma.student.findMany({
            include: {
                user: { select: { role: true, status: true } },
            },
            where: { user: { role: "PATIENT" } },
        });

        // 👩‍💼 Employee patients
        const employees = await prisma.employee.findMany({
            include: {
                user: { select: { role: true, status: true } },
            },
            where: { user: { role: "PATIENT" } },
        });

        const records = [
            ...students.map((s) => ({
                id: s.stud_user_id,
                patientId: s.student_id,
                fullName: `${s.fname} ${s.mname ? s.mname + " " : ""}${s.lname}`,
                patientType: "Student",
                gender: s.gender,
                date_of_birth: s.date_of_birth.toISOString(),
                department: s.department,
                program: s.program,
                specialization: s.specialization,
                year_level: s.year_level,
                contactno: s.contactno,
                address: s.address,
                bloodtype: s.bloodtype,
                allergies: s.allergies,
                medical_cond: s.medical_cond,
                emergency: {
                    name: s.emergencyco_name,
                    num: s.emergencyco_num,
                    relation: s.emergencyco_relation,
                },
                status: s.user.status,
            })),
            ...employees.map((e) => ({
                id: e.emp_id,
                patientId: e.employee_id,
                fullName: `${e.fname} ${e.mname ? e.mname + " " : ""}${e.lname}`,
                patientType: "Employee",
                gender: e.gender,
                date_of_birth: e.date_of_birth.toISOString(),
                contactno: e.contactno,
                address: e.address,
                bloodtype: e.bloodtype,
                allergies: e.allergies,
                medical_cond: e.medical_cond,
                emergency: {
                    name: e.emergencyco_name,
                    num: e.emergencyco_num,
                    relation: e.emergencyco_relation,
                },
                status: e.user.status,
            })),
        ];

        return NextResponse.json(records);
    } catch (err) {
        console.error("[GET /api/nurse/records]", err);
        return NextResponse.json(
            { error: "Failed to fetch patient records" },
            { status: 500 }
        );
    }
}
