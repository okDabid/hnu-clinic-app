import type { Appointment, DoctorAvailability } from "@prisma/client";

export type TimeSlot = { start: string; end: string };

const SLOT_MINUTES = 15;

const fmtHHmmManila = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Manila",
    }).format(date);

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

export function computeSlotsForDoctor(
    doctorAvailabilities: DoctorAvailability[],
    doctorAppointments: Pick<Appointment, "appointment_timestart" | "appointment_timeend">[]
): TimeSlot[] {
    if (doctorAvailabilities.length === 0) {
        return [];
    }

    const slots: TimeSlot[] = [];

    for (const availability of doctorAvailabilities) {
        let cursor = new Date(availability.available_timestart);

        while (cursor < availability.available_timeend) {
            const next = new Date(cursor.getTime() + SLOT_MINUTES * 60 * 1000);

            if (next <= availability.available_timeend) {
                const blocked = doctorAppointments.some((appointment) =>
                    overlaps(cursor, next, appointment.appointment_timestart, appointment.appointment_timeend)
                );

                if (!blocked) {
                    slots.push({ start: fmtHHmmManila(cursor), end: fmtHHmmManila(next) });
                }
            }

            cursor = new Date(cursor.getTime() + SLOT_MINUTES * 60 * 1000);
        }
    }

    return slots;
}

export function computeSlotsForDoctors(
    availabilities: DoctorAvailability[],
    appointments: (Pick<Appointment, "appointment_timestart" | "appointment_timeend"> & {
        doctor_user_id: string;
    })[]
): Record<string, TimeSlot[]> {
    const availabilityByDoctor = new Map<string, DoctorAvailability[]>();
    const appointmentsByDoctor = new Map<
        string,
        (Pick<Appointment, "appointment_timestart" | "appointment_timeend"> & { doctor_user_id: string })[]
    >();

    for (const availability of availabilities) {
        const collection = availabilityByDoctor.get(availability.doctor_user_id) ?? [];
        collection.push(availability);
        availabilityByDoctor.set(availability.doctor_user_id, collection);
    }

    for (const appointment of appointments) {
        const collection = appointmentsByDoctor.get(appointment.doctor_user_id) ?? [];
        collection.push(appointment);
        appointmentsByDoctor.set(appointment.doctor_user_id, collection);
    }

    const result: Record<string, TimeSlot[]> = {};

    for (const [doctorId, doctorAvailabilities] of availabilityByDoctor.entries()) {
        const doctorAppointments = appointmentsByDoctor.get(doctorId) ?? [];
        result[doctorId] = computeSlotsForDoctor(doctorAvailabilities, doctorAppointments);
    }

    for (const doctorId of appointmentsByDoctor.keys()) {
        if (!(doctorId in result)) {
            result[doctorId] = [];
        }
    }

    return result;
}
