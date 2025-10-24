export type Clinic = {
    clinic_id: string;
    clinic_name: string;
};

export type Availability = {
    availability_id: string;
    available_date: string;
    available_timestart: string;
    available_timeend: string;
    is_on_leave: boolean;
    clinic: Clinic;
};

export type SlotsResponse = {
    data?: Availability[];
    total?: number;
    totalPages?: number;
    page?: number;
    pageSize?: number;
    error?: string;
};

export type NormalizedSlotsPayload = {
    slots: Availability[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
};

export const DEFAULT_PAGE_SIZE = 25;

export function normalizeConsultationSlots(
    response: SlotsResponse | null,
    fallbackPage = 1
): NormalizedSlotsPayload {
    const slots = Array.isArray(response?.data) ? response!.data : [];
    const total = typeof response?.total === "number" ? response.total : slots.length;
    const pageSize =
        typeof response?.pageSize === "number" && response.pageSize > 0 ? response.pageSize : DEFAULT_PAGE_SIZE;
    const page = typeof response?.page === "number" ? response.page : fallbackPage;
    const totalPages =
        typeof response?.totalPages === "number"
            ? response.totalPages
            : Math.max(1, Math.ceil((total || 1) / pageSize));

    return {
        slots,
        total,
        totalPages,
        page,
        pageSize,
    };
}
