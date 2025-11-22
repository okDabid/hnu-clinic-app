import crypto from "crypto";

/**
 * Builds a stable, cache-busting avatar URL for the given user.
 *
 * The returned URL points to the internal avatar endpoint and includes a hash of
 * the stored image contents, ensuring clients can refresh when the image
 * changes while keeping the exposed label short and clean.
 */
export function buildProfileImagePath(
    userId: string,
    imageData: string | null | undefined
): string | null {
    if (!imageData) return null;
    const hash = crypto.createHash("md5").update(imageData).digest("hex");
    return `/api/profile/avatar/${userId}?v=${hash}`;
}
