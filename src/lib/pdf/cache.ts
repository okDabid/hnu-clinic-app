type CacheEntry = {
    data: ArrayBuffer;
    expiresAt: number;
};

export class PdfCache {
    private entries = new Map<string, CacheEntry>();

    constructor(private ttlMs: number) { }

    get(key: string) {
        const entry = this.entries.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.entries.delete(key);
            return null;
        }

        return entry.data.slice(0);
    }

    set(key: string, value: ArrayBuffer) {
        this.entries.set(key, {
            data: value.slice(0),
            expiresAt: Date.now() + this.ttlMs,
        });
    }
}
