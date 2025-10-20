import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CacheStorage, getCacheEntry, removeCacheEntry, setCacheEntry } from "@/lib/cache";

interface UseCachedResourceOptions<T> {
    cacheKey: string;
    fetcher: () => Promise<T>;
    enabled?: boolean;
    ttl?: number;
    storage?: CacheStorage;
}

interface CachedResourceState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    isStale: boolean;
}

interface RefreshOptions {
    ignoreCache?: boolean;
    silent?: boolean;
}

export interface CachedResourceResult<T> extends CachedResourceState<T> {
    refresh: (options?: RefreshOptions) => Promise<T | null>;
    mutate: (updater: (current: T | null) => T | null) => void;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useCachedResource<T>(options: UseCachedResourceOptions<T>): CachedResourceResult<T> {
    const { cacheKey, fetcher, enabled = true, ttl = DEFAULT_TTL, storage = "local" } = options;

    const fetcherRef = useRef(fetcher);
    const ttlRef = useRef(ttl);
    const cacheKeyRef = useRef(cacheKey);
    const storageRef = useRef<CacheStorage>(storage);
    const mountedRef = useRef(true);

    useEffect(() => {
        fetcherRef.current = fetcher;
    }, [fetcher]);

    useEffect(() => {
        ttlRef.current = ttl;
    }, [ttl]);

    useEffect(() => {
        cacheKeyRef.current = cacheKey;
    }, [cacheKey]);

    useEffect(() => {
        storageRef.current = storage;
    }, [storage]);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const [state, setState] = useState<CachedResourceState<T>>({
        data: null,
        loading: enabled,
        error: null,
        isStale: false,
    });

    const setStateSafe = useCallback(
        (value: CachedResourceState<T> | ((prev: CachedResourceState<T>) => CachedResourceState<T>)) => {
            if (!mountedRef.current) return;
            setState(value);
        },
        []
    );

    const readCache = useCallback(() => {
        const entry = getCacheEntry<T>(cacheKeyRef.current, storageRef.current);
        if (!entry) return null;
        const expired = Date.now() > entry.timestamp + entry.ttl;
        return { entry, expired };
    }, []);

    const load = useCallback(
        async ({ ignoreCache = false, silent = false }: RefreshOptions = {}): Promise<T | null> => {
            if (!enabled) {
                setStateSafe({ data: null, loading: false, error: null, isStale: false });
                return null;
            }

            const cached = ignoreCache ? null : readCache();

            if (cached && !cached.expired) {
                setStateSafe({
                    data: cached.entry.value,
                    loading: false,
                    error: null,
                    isStale: false,
                });
                return cached.entry.value;
            }

            if (cached && cached.expired) {
                setStateSafe((prev) => ({
                    data: cached?.entry.value ?? prev.data,
                    loading: silent ? prev.loading : true,
                    error: null,
                    isStale: true,
                }));
            } else if (!silent) {
                setStateSafe((prev) => ({
                    data: prev.data,
                    loading: true,
                    error: null,
                    isStale: prev.isStale,
                }));
            }

            try {
                const result = await fetcherRef.current();
                setStateSafe({ data: result, loading: false, error: null, isStale: false });
                setCacheEntry(cacheKeyRef.current, result, ttlRef.current, storageRef.current);
                return result;
            } catch (error) {
                const err = error instanceof Error ? error : new Error("Failed to load resource");
                setStateSafe((prev) => ({
                    data: prev.data,
                    loading: false,
                    error: err,
                    isStale: prev.data !== null || prev.isStale || Boolean(cached?.entry),
                }));
                return null;
            }
        },
        [enabled, readCache, setStateSafe]
    );

    useEffect(() => {
        if (!enabled) {
            setStateSafe({ data: null, loading: false, error: null, isStale: false });
            return;
        }
        void load({ ignoreCache: false, silent: false });
    }, [enabled, cacheKey, load, setStateSafe]);

    const refresh = useCallback(
        async (options: RefreshOptions = {}): Promise<T | null> => {
            return load({ ignoreCache: options.ignoreCache ?? true, silent: options.silent ?? false });
        },
        [load]
    );

    const mutate = useCallback(
        (updater: (current: T | null) => T | null) => {
            setStateSafe((prev) => {
                const nextValue = updater(prev.data);
                if (nextValue === prev.data) {
                    return prev;
                }
                if (nextValue === null) {
                    removeCacheEntry(cacheKeyRef.current, storageRef.current);
                    return { data: null, loading: false, error: null, isStale: false };
                }
                setCacheEntry(cacheKeyRef.current, nextValue, ttlRef.current, storageRef.current);
                return { data: nextValue, loading: false, error: null, isStale: false };
            });
        },
        [setStateSafe]
    );

    return useMemo(
        () => ({
            data: state.data,
            loading: state.loading,
            error: state.error,
            isStale: state.isStale,
            refresh,
            mutate,
        }),
        [mutate, refresh, state.data, state.error, state.isStale, state.loading]
    );
}
