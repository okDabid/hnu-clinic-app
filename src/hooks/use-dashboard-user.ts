"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";

export function useDashboardUser(fallbackName: string) {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? fallbackName;
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

    return { firstName, fullName };
}
