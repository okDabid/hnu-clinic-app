import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";

export type PatientRecordEntry = {
    id: string;
    patientId: string;
    fullName: string;
    patientType: "Student" | "Employee";
    gender: string | null;
    date_of_birth: string | null;
    status: string;
    department?: string | null;
    program?: string | null;
    year_level?: string | null;
    contactno?: string | null;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medical_cond?: string | null;
    emergency?: {
        name?: string | null;
        num?: string | null;
        relation?: string | null;
    };
    appointment_id: string | null;
    latestAppointment: {
        id: string;
        timestart: string | null;
        timeend: string | null;
    } | null;
};

function normalizeName(fname?: string | null, mname?: string | null, lname?: string | null) {
    const nameParts = [fname, mname, lname].filter(Boolean);
    return nameParts.join(" ");
}

export async function fetchPatientRecords(): Promise<PatientRecordEntry[]> {
    const appointmentSelection = {
        where: {
            status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved, AppointmentStatus.Completed] },
        },
        orderBy: { appointment_date: "desc" as const },
        take: 1,
        select: {
            appointment_id: true,
            appointment_timestart: true,
            appointment_timeend: true,
        },
    };

    const [students, employees] = await Promise.all([
        prisma.student.findMany({
            include: {
                user: {
                    select: {
                        role: true,
                        status: true,
                        user_id: true,
                        appointmentsPatient: appointmentSelection,
                    },
                },
            },
            where: { user: { role: "PATIENT" } },
        }),
        prisma.employee.findMany({
            include: {
                user: {
                    select: {
                        role: true,
                        status: true,
                        user_id: true,
                        appointmentsPatient: appointmentSelection,
                    },
                },
            },
            where: { user: { role: "PATIENT" } },
        }),
    ]);

    const studentRecords: PatientRecordEntry[] = students.map((student) => {
        const appointment = student.user.appointmentsPatient?.[0] ?? null;
        return {
            id: student.stud_user_id,
            patientId: student.student_id,
            fullName: normalizeName(student.fname, student.mname, student.lname),
            patientType: "Student",
            gender: student.gender ?? null,
            date_of_birth: student.date_of_birth?.toISOString() ?? null,
            status: student.user.status,
            department: student.department,
            program: student.program,
            year_level: student.year_level,
            contactno: student.contactno,
            address: student.address,
            bloodtype: student.bloodtype,
            allergies: student.allergies,
            medical_cond: student.medical_cond,
            emergency: {
                name: student.emergencyco_name,
                num: student.emergencyco_num,
                relation: student.emergencyco_relation,
            },
            appointment_id: appointment?.appointment_id ?? null,
            latestAppointment: appointment
                ? {
                    id: appointment.appointment_id,
                    timestart: appointment.appointment_timestart?.toISOString() ?? null,
                    timeend: appointment.appointment_timeend?.toISOString() ?? null,
                }
                : null,
        };
    });

    const employeeRecords: PatientRecordEntry[] = employees.map((employee) => {
        const appointment = employee.user.appointmentsPatient?.[0] ?? null;
        return {
            id: employee.emp_id,
            patientId: employee.employee_id,
            fullName: normalizeName(employee.fname, employee.mname, employee.lname),
            patientType: "Employee",
            gender: employee.gender ?? null,
            date_of_birth: employee.date_of_birth?.toISOString() ?? null,
            status: employee.user.status,
            contactno: employee.contactno,
            address: employee.address,
            bloodtype: employee.bloodtype,
            allergies: employee.allergies,
            medical_cond: employee.medical_cond,
            emergency: {
                name: employee.emergencyco_name,
                num: employee.emergencyco_num,
                relation: employee.emergencyco_relation,
            },
            appointment_id: appointment?.appointment_id ?? null,
            latestAppointment: appointment
                ? {
                    id: appointment.appointment_id,
                    timestart: appointment.appointment_timestart?.toISOString() ?? null,
                    timeend: appointment.appointment_timeend?.toISOString() ?? null,
                }
                : null,
        };
    });

    return [...studentRecords, ...employeeRecords];
}
