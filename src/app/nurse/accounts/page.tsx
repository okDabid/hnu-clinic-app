import { unstable_noStore as noStore } from "next/cache";

import { NurseAccountsPageClient } from "./page.client";
import type { NurseAccountProfileApi, NurseAccountsUserApi } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function NurseAccountsPage() {
    noStore();
    const [initialUsers, initialProfile] = await Promise.all([
        serverFetch<NurseAccountsUserApi[]>("/api/nurse/accounts"),
        serverFetch<NurseAccountProfileApi>("/api/nurse/accounts/me"),
    ]);

    return (
        <NurseAccountsPageClient
            initialUsers={initialUsers}
            initialProfile={initialProfile}
        />
    );
}
