import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import NurseAccountsLoading from "./loading";
import { NurseAccountsPageClient } from "./page.client";
import {
    normalizeNurseAccountProfile,
    normalizeNurseAccountUsers,
    type NurseAccountProfileApi,
    type NurseAccountsUserApi,
} from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function NurseAccountsPage() {
    noStore();
    const [initialUsers, initialProfile] = await Promise.all([
        serverFetch<NurseAccountsUserApi[]>("/api/nurse/accounts"),
        serverFetch<NurseAccountProfileApi>("/api/nurse/accounts/me"),
    ]);

    const normalizedUsers = normalizeNurseAccountUsers(initialUsers);
    const normalizedProfile = normalizeNurseAccountProfile(initialProfile);

    return (
        <Suspense fallback={<NurseAccountsLoading />}>
            <NurseAccountsPageClient
                initialUsers={normalizedUsers}
                initialProfile={normalizedProfile}
                initialUsersLoaded={Array.isArray(initialUsers)}
                initialProfileLoaded={Boolean(normalizedProfile)}
            />
        </Suspense>
    );
}
