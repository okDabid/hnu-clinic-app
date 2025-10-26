type CacheEntry = {
    data: Uint8Array;
    expiresAt: number;
};

function cloneToUint8Array(value: ArrayBufferLike | Uint8Array) {
    if (value instanceof Uint8Array) {
        return value.slice();
    }

    const copy = new Uint8Array(value.byteLength);
    copy.set(new Uint8Array(value));
    return copy;
}

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

        return entry.data.slice();
    }

    set(key: string, value: ArrayBufferLike | Uint8Array) {
        this.entries.set(key, {
            data: cloneToUint8Array(value),
            expiresAt: Date.now() + this.ttlMs,
        });
    }
}
