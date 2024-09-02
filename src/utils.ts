import { Effect, Function } from 'effect'

type Entries<T extends Record<any, any>> = {
    [K in keyof T]: [K, T[K]]
}[keyof T][]

/**
 * Only use this function if you are certain that the object will only ever have the entries defined in TypeScript.
 * TypeScript doesn't guard for unknown keys in the object.
 */
export const objectEntriesUnsafe: <T extends Record<any, any>>(object: T) => Entries<T> =
    Object.entries

export function tapLogTrace<A>(
    message: string,
    transform: (value: NoInfer<A>) => any = Function.identity,
): <E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R> {
    return Effect.tap((value) => {
        const transformedValue = transform(value)
        const traceMessages = Array.isArray(transformedValue)
            ? transformedValue
            : [transformedValue]

        return Effect.logTrace(message, ...traceMessages)
    })
}
