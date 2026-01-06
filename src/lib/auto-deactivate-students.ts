import prisma from "./prisma";
import { Role, AccountStatus } from "@prisma/client";

// Marks student patient accounts inactive when no activity is detected for 5+ years.
export async function autoDeactivateOldStudents() {
    try {
        const FIVE_YEARS_MS = 1000 * 60 * 60 * 24 * 365 * 5;
        const threshold = new Date(Date.now() - FIVE_YEARS_MS);

        const candidateUsers = await prisma.users.findMany({
            where: { role: Role.PATIENT, status: AccountStatus.Active, student: { is: {} } },
            select: { user_id: true },
        });

        for (const u of candidateUsers) {
            const userId = u.user_id;

            const [latestUser] = await prisma.users.findMany({
                where: { user_id: userId },
                select: { updatedAt: true },
            });

            const latestAppointment = await prisma.appointment.findFirst({
                where: {
                    OR: [{ patient_user_id: userId }, { created_by_user_id: userId }],
                },
                orderBy: { updatedAt: "desc" },
                select: { updatedAt: true, createdAt: true },
            });

            const latestMedCert = await prisma.medCert.findFirst({
                where: { patient_user_id: userId },
                orderBy: { updatedAt: "desc" },
                select: { updatedAt: true, createdAt: true },
            });

            const latestDispense = await prisma.medDispense.findFirst({
                where: {
                    OR: [
                        { scholar_user_id: userId },
                        { consultation: { appointment: { patient_user_id: userId } } },
                    ],
                },
                orderBy: { updatedAt: "desc" },
                select: { updatedAt: true, createdAt: true },
            });

            const candidates: (Date | null)[] = [
                latestUser?.updatedAt ?? null,
                latestAppointment?.updatedAt ?? latestAppointment?.createdAt ?? null,
                latestMedCert?.updatedAt ?? latestMedCert?.createdAt ?? null,
                latestDispense?.updatedAt ?? latestDispense?.createdAt ?? null,
            ];

            const latest = candidates.reduce<Date | null>((acc, cur) => {
                if (!cur) return acc;
                if (!acc) return cur;
                return cur > acc ? cur : acc;
            }, null);

            if (!latest || latest < threshold) {
                await prisma.$transaction([
                    prisma.users.update({ where: { user_id: userId }, data: { status: AccountStatus.Inactive } }),
                    prisma.student.updateMany({ where: { user_id: userId }, data: { status: AccountStatus.Inactive } }),
                ]);
            }
        }
    } catch (err) {
        // don't throw — cron job should log but not break app
        // eslint-disable-next-line no-console
        console.error("[autoDeactivateOldStudents]", err);
    }
}

export default autoDeactivateOldStudents;
