import { NodeRuntime } from '@effect/platform-node'
import { Cause, Effect, Exit } from 'effect'

export function runMainTest<A, E>(effect: Effect.Effect<A, E>) {
    return NodeRuntime.runMain(effect, {
        teardown: (exit) => {
            if (Exit.isFailure(exit)) {
                if (Cause.isFailType(exit.cause)) {
                    throw exit.cause.error
                }

                throw new Error(`Unexpected exit with cause: ${exit.cause}`)
            }
        },
    })
}
