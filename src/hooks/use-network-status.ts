import { useEffect, useMemo, useState } from "react";

type EffectiveType = "slow-2g" | "2g" | "3g" | "4g" | "5g" | "unknown";

type NavigatorConnection = {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
};

function getNavigatorConnection(): NavigatorConnection | null {
    if (typeof navigator === "undefined") return null;
    const connection =
        (navigator as unknown as { connection?: NavigatorConnection }).connection ||
        (navigator as unknown as { mozConnection?: NavigatorConnection }).mozConnection ||
        (navigator as unknown as { webkitConnection?: NavigatorConnection }).webkitConnection;
    return connection ?? null;
}

export interface NetworkStatus {
    isOnline: boolean;
    effectiveType: EffectiveType;
    downlink: number | null;
    rtt: number | null;
    saveData: boolean;
    isSlow: boolean;
}

function normalizeEffectiveType(value?: string): EffectiveType {
    if (!value) return "unknown";
    const normalized = value.toLowerCase();
    if (normalized === "slow-2g" || normalized === "2g" || normalized === "3g" || normalized === "4g") {
        return normalized;
    }
    if (normalized === "5g") return "5g";
    return "unknown";
}

export function useNetworkStatus(): NetworkStatus {
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
    const [effectiveType, setEffectiveType] = useState<EffectiveType>(() => {
        const connection = getNavigatorConnection();
        return normalizeEffectiveType(connection?.effectiveType);
    });
    const [downlink, setDownlink] = useState<number | null>(() => {
        const connection = getNavigatorConnection();
        return typeof connection?.downlink === "number" ? connection.downlink : null;
    });
    const [rtt, setRtt] = useState<number | null>(() => {
        const connection = getNavigatorConnection();
        return typeof connection?.rtt === "number" ? connection.rtt : null;
    });
    const [saveData, setSaveData] = useState<boolean>(() => {
        const connection = getNavigatorConnection();
        return Boolean(connection?.saveData);
    });

    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);
        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
        };
    }, []);

    useEffect(() => {
        const connection = getNavigatorConnection();
        if (!connection || typeof connection.addEventListener !== "function") return;

        const updateConnection = () => {
            setEffectiveType(normalizeEffectiveType(connection.effectiveType));
            setDownlink(typeof connection.downlink === "number" ? connection.downlink : null);
            setRtt(typeof connection.rtt === "number" ? connection.rtt : null);
            setSaveData(Boolean(connection.saveData));
        };

        updateConnection();
        connection.addEventListener("change", updateConnection);
        return () => {
            connection.removeEventListener?.("change", updateConnection);
        };
    }, []);

    const isSlow = useMemo(() => {
        if (!isOnline) return true;
        if (saveData) return true;
        if (effectiveType === "slow-2g" || effectiveType === "2g") return true;
        if (effectiveType === "3g" && (downlink ?? 0) < 1.5) return true;
        return false;
    }, [downlink, effectiveType, isOnline, saveData]);

    return {
        isOnline,
        effectiveType,
        downlink,
        rtt,
        saveData,
        isSlow,
    };
}
