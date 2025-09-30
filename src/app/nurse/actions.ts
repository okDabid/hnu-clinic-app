"use server";

const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // fallback for dev

// --------------------
// Types
// --------------------
export type CreateUserPayload = {
    role: string;
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth: string; // ISO string from form
    gender: "Male" | "Female";
    employee_id?: string | null;
    student_id?: string | null;
    school_id?: string | null;
    patientType?: "student" | "employee" | null;
};

export type CreateUserResponse = {
    success: boolean;
    id: string;
    password: string;
    error?: string;
};

export type UserSummary = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    fullName: string;
};

// --------------------
// Actions
// --------------------
export async function createUser(
    payload: CreateUserPayload
): Promise<CreateUserResponse> {
    const res = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error("Failed to create user");
    }

    return res.json();
}

export async function getUsers(): Promise<UserSummary[]> {
    const res = await fetch(`${baseUrl}/api/users`, {
        method: "GET",
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch users");
    }

    return res.json();
}

export async function toggleUserStatus(
    userId: string,
    newStatus: string
): Promise<void> {
    const res = await fetch(`${baseUrl}/api/users`, {
        method: "PATCH",
        body: JSON.stringify({ userId, status: newStatus }),
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error("Failed to update user status");
    }
}
