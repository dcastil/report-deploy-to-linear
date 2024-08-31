import { NodeRuntime } from '@effect/platform-node'
import { Cause, Effect, Exit } from 'effect'
import { ActionError } from './error-handling'

export function runMainLive<A>(effect: Effect.Effect<A, ActionError>) {
    return NodeRuntime.runMain(effect, { disableErrorReporting: true })
}

export function runMainTest<A>(effect: Effect.Effect<A, ActionError>) {
    return NodeRuntime.runMain(effect, {
        disableErrorReporting: true,
        teardown: (exit) => {
            if (Exit.isSuccess(exit)) {
                return
            }

            if (Cause.isFailType(exit.cause) && exit.cause.error) {
                throw exit.cause.error
            }

            throw exit.cause
        },
    })
}
