import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { manilaNow } from "@/lib/time";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ARCHIVED_RETENTION_MS = DAY_IN_MS;

/**
 * Mark duty hours as archived when they are more than 24 hours past their end time.
 * Archived entries older than the retention window are permanently deleted to
 * keep the table lightweight.
 */
export async function archiveExpiredDutyHours(
    where: Prisma.DoctorAvailabilityWhereInput = {}
) {
    const now = manilaNow();
    const cutoff = new Date(now.getTime() - DAY_IN_MS);

    const criteria: Prisma.DoctorAvailabilityWhereInput = {
        archivedAt: null,
        available_timeend: { lt: cutoff },
        ...where,
    };

    await prisma.doctorAvailability.updateMany({
        where: criteria,
        data: { archivedAt: now },
    });

    const deletionCutoff = new Date(now.getTime() - ARCHIVED_RETENTION_MS);

    await prisma.doctorAvailability.deleteMany({
        where: {
            AND: [
                where,
                { archivedAt: { not: null, lt: deletionCutoff } },
            ],
        },
    });
}
