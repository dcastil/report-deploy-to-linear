type Entries<T extends Record<any, any>> = {
    [K in keyof T]: [K, T[K]]
}[keyof T][]

/**
 * Only use this function if you are certain that the object will only ever have the entries defined in TypeScript.
 * TypeScript doesn't guard for unknown keys in the object.
 */
export const objectEntriesUnsafe: <T extends Record<any, any>>(object: T) => Entries<T> =
    Object.entries
