"use server";

const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // fallback for dev

export async function createUser(payload: any) {
    const res = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    return res.json();
}

export async function getUsers() {
    const res = await fetch(`${baseUrl}/api/users`, {
        method: "GET",
        cache: "no-store",
    });

    return res.json();
}

export async function toggleUserStatus(userId: string, newStatus: string) {
    await fetch(`${baseUrl}/api/users`, {
        method: "PATCH",
        body: JSON.stringify({ userId, status: newStatus }),
        headers: { "Content-Type": "application/json" },
    });
}
