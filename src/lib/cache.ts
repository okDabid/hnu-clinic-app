export type CacheStorage = Storage | "local" | "session" | null | undefined;

export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttl: number;
}

function resolveStorage(storage: CacheStorage): Storage | null {
    if (typeof window === "undefined") {
        return null;
    }

    if (!storage || storage === "local") {
        return window.localStorage;
    }

    if (storage === "session") {
        return window.sessionStorage;
    }

    return storage;
}

export function getCacheEntry<T>(key: string, storage: CacheStorage = "local"): CacheEntry<T> | null {
    const resolved = resolveStorage(storage);
    if (!resolved) return null;

    try {
        const raw = resolved.getItem(key);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<CacheEntry<T>> | null;
        if (!parsed || typeof parsed !== "object") {
            resolved.removeItem(key);
            return null;
        }

        if (typeof parsed.timestamp !== "number" || typeof parsed.ttl !== "number") {
            resolved.removeItem(key);
            return null;
        }

        return parsed as CacheEntry<T>;
    } catch {
        resolved.removeItem(key);
        return null;
    }
}

export function setCacheEntry<T>(
    key: string,
    value: T,
    ttl: number,
    storage: CacheStorage = "local"
): void {
    const resolved = resolveStorage(storage);
    if (!resolved) return;

    const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl,
    };

    try {
        resolved.setItem(key, JSON.stringify(entry));
    } catch {
        // Silently ignore quota errors.
    }
}

export function removeCacheEntry(key: string, storage: CacheStorage = "local"): void {
    const resolved = resolveStorage(storage);
    if (!resolved) return;

    resolved.removeItem(key);
}
