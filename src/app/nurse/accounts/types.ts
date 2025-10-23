import orderBy from "lodash/orderBy";

export type NurseAccountsUserApi = {
    user_id?: string;
    accountId?: string;
    id?: string;
    role?: string;
    status?: "Active" | "Inactive";
    fullName?: string;
    fname?: string;
    mname?: string | null;
    lname?: string;
    specialization?: "Physician" | "Dentist" | null;
};

export type NurseAccountProfileApi = {
    accountId?: string;
    username?: string;
    role?: string;
    status?: "Active" | "Inactive";
    error?: string;
    profile?: {
        fname?: string;
        mname?: string | null;
        lname?: string;
        date_of_birth?: string;
        contactno?: string | null;
        email?: string;
        address?: string | null;
        bloodtype?: string | null;
        allergies?: string | null;
        medical_cond?: string | null;
        emergencyco_name?: string | null;
        emergencyco_num?: string | null;
        emergencyco_relation?: string | null;
    } | null;
};

export type NurseAccountUser = {
    user_id: string;
    accountId: string;
    role: string;
    status: "Active" | "Inactive";
    fullName: string;
    specialization: "Physician" | "Dentist" | null;
};

export type NurseAccountProfile = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth?: string;
    contactno?: string | null;
    email?: string;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medical_cond?: string | null;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

export const nurseBloodTypeEnumMap: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
};

export const nurseReverseBloodTypeEnumMap = Object.fromEntries(
    Object.entries(nurseBloodTypeEnumMap).map(([key, val]) => [val, key])
);

export function normalizeNurseAccountUsers(
    data: NurseAccountsUserApi[] | null | undefined
): NurseAccountUser[] {
    if (!Array.isArray(data)) {
        return [];
    }

    const seen = new Set<string>();
    const usersData: NurseAccountUser[] = [];

    for (const user of data) {
        const accountId = user.accountId || user.user_id || user.id || "N/A";
        const role = user.role || "Unknown";
        const dedupKey = `${accountId}-${role}`;

        if (seen.has(dedupKey)) {
            continue;
        }

        seen.add(dedupKey);
        usersData.push({
            user_id: user.user_id || user.accountId || user.id || "N/A",
            accountId,
            role,
            status: user.status || "Inactive",
            fullName:
                user.fullName ||
                [user.fname, user.mname, user.lname].filter(Boolean).join(" ") ||
                "Unnamed",
            specialization: user.specialization ?? null,
        });
    }

    return orderBy(
        usersData,
        [
            (item) => item.role.toLowerCase(),
            (item) => {
                const numeric = Number.parseInt(item.user_id, 10);
                return Number.isNaN(numeric) ? item.user_id : numeric;
            },
        ],
        ["asc", "asc"]
    );
}

export function normalizeNurseAccountProfile(
    response: NurseAccountProfileApi | null | undefined
): NurseAccountProfile | null {
    if (!response || response.error) {
        return null;
    }

    const bloodTypeValue = response.profile?.bloodtype
        ? nurseBloodTypeEnumMap[response.profile.bloodtype] || response.profile.bloodtype
        : "";

    return {
        user_id: response.accountId || "",
        username: response.username || "",
        role: response.role || "",
        status: response.status || "Inactive",
        fname: response.profile?.fname || "",
        mname: response.profile?.mname || "",
        lname: response.profile?.lname || "",
        date_of_birth: response.profile?.date_of_birth || "",
        contactno: response.profile?.contactno || "",
        email: response.profile?.email || "",
        address: response.profile?.address || "",
        bloodtype: bloodTypeValue,
        allergies: response.profile?.allergies || "",
        medical_cond: response.profile?.medical_cond || "",
        emergencyco_name: response.profile?.emergencyco_name || "",
        emergencyco_num: response.profile?.emergencyco_num || "",
        emergencyco_relation: response.profile?.emergencyco_relation || "",
    };
}
