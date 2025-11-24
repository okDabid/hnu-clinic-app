import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import NurseAccountsLoading from "./loading";
import { NurseAccountsPageClient } from "./page.client";
import { normalizeNurseAccountProfile, normalizeNurseAccountUsers, type NurseAccountProfileApi } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function NurseAccountsPage() {
    noStore();
    const initialProfile = await serverFetch<NurseAccountProfileApi>("/api/nurse/accounts/me");

    const normalizedUsers = normalizeNurseAccountUsers([]);
    const normalizedProfile = normalizeNurseAccountProfile(initialProfile);

    return (
        <Suspense fallback={<NurseAccountsLoading />}>
            <NurseAccountsPageClient
                initialUsers={normalizedUsers}
                initialProfile={normalizedProfile}
                initialUsersLoaded={false}
                initialProfileLoaded={Boolean(normalizedProfile)}
            />
        </Suspense>
    );
}
