export type DispenseSummary = {
    total: number;
    consultations: number;
    walkIns: number;
    latestDispense: string | null;
    totalQuantity: number;
};

export type DispenseLike = {
    consultation: unknown | null;
    quantity: number;
    createdAt: string;
};

export function summarizeDispenses(records: DispenseLike[]): DispenseSummary {
    let walkIns = 0;
    let latest: string | null = null;
    let totalQuantity = 0;

    for (const record of records) {
        if (!record.consultation) {
            walkIns += 1;
        }

        totalQuantity += Number(record.quantity) || 0;

        if (!latest || new Date(record.createdAt).getTime() > new Date(latest).getTime()) {
            latest = record.createdAt;
        }
    }

    return {
        total: records.length,
        consultations: records.length - walkIns,
        walkIns,
        latestDispense: latest,
        totalQuantity,
    };
}