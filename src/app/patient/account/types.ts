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
