export type PatientAccountProfileApi = {
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
        email?: string;
        contactno?: string | null;
        address?: string | null;
        bloodtype?: string | null;
        allergies?: string | null;
        medical_cond?: string | null;
        gender?: string | null;
        department?: string | null;
        program?: string | null;
        year_level?: string | null;
        emergencyco_name?: string | null;
        emergencyco_num?: string | null;
        emergencyco_relation?: string | null;
    } | null;
    patientType?: string | null;
    type?: string | null;
};

export const patientDepartmentEnumMap: Record<string, string> = {
    EDUCATION: "College of Education",
    ARTS_AND_SCIENCES: "College of Arts and Sciences",
    BUSINESS_AND_ACCOUNTANCY: "College of Business and Accountancy",
    ENGINEERING_AND_COMPUTER_STUDIES: "College of Engineering and Computer Studies",
    HEALTH_SCIENCES: "College of Health Sciences",
    LAW: "College of Law",
    BASIC_EDUCATION: "Basic Education Department",
};

export const patientReverseDepartmentEnumMap = Object.fromEntries(
    Object.entries(patientDepartmentEnumMap).map(([key, val]) => [val, key])
);

export const patientYearLevelEnumMap: Record<string, string> = {
    FIRST_YEAR: "1st Year",
    SECOND_YEAR: "2nd Year",
    THIRD_YEAR: "3rd Year",
    FOURTH_YEAR: "4th Year",
    FIFTH_YEAR: "5th Year",
    KINDERGARTEN: "Kindergarten",
    ELEMENTARY: "Elementary",
    JUNIOR_HIGH: "Junior High School",
    SENIOR_HIGH: "Senior High School",
};

export const patientReverseYearLevelEnumMap = Object.fromEntries(
    Object.entries(patientYearLevelEnumMap).map(([key, val]) => [val, key])
);

export const patientBloodTypeEnumMap: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
};

export const patientReverseBloodTypeEnumMap = Object.fromEntries(
    Object.entries(patientBloodTypeEnumMap).map(([key, val]) => [val, key])
);

export type PatientAccountProfile = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth?: string;
    email?: string;
    contactno?: string | null;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medical_cond?: string | null;
    gender?: string | null;
    department?: string | null;
    program?: string | null;
    year_level?: string | null;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

export type PatientAccountNormalization = {
    profile: PatientAccountProfile | null;
    type: string | null;
};

export function normalizePatientAccountProfile(
    response: PatientAccountProfileApi | null | undefined
): PatientAccountNormalization {
    if (!response || response.error) {
        return { profile: null, type: null };
    }

    const raw = response.profile ?? {};
    const profile: PatientAccountProfile = {
        user_id: response.accountId || "",
        username: response.username || "",
        role: response.role || "",
        status: response.status || "Inactive",
        fname: raw.fname || "",
        mname: raw.mname || "",
        lname: raw.lname || "",
        date_of_birth: raw.date_of_birth || "",
        email: raw.email || "",
        contactno: raw.contactno || "",
        address: raw.address || "",
        bloodtype: raw.bloodtype ? patientBloodTypeEnumMap[raw.bloodtype] || raw.bloodtype : "",
        allergies: raw.allergies || "",
        medical_cond: raw.medical_cond || "",
        gender: raw.gender || "",
        department: raw.department ? patientDepartmentEnumMap[raw.department] || "" : "",
        program: raw.program || "",
        year_level: raw.year_level ? patientYearLevelEnumMap[raw.year_level] || "" : "",
        emergencyco_name: raw.emergencyco_name || "",
        emergencyco_num: raw.emergencyco_num || "",
        emergencyco_relation: raw.emergencyco_relation || "",
    };

    return {
        profile,
        type: response.patientType ?? response.type ?? null,
    };
}
