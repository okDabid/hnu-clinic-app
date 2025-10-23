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
