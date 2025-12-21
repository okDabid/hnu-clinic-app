/**
 * Returns a new array sorted alphabetically by the `fullName` field.
 */
export function sortByFullName<T extends { fullName: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }));
}
