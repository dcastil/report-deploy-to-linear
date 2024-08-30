import { Effect, Logger } from 'effect'
import { ExitError } from './error-handling'
import { InputsLive } from './services/inputs'

export const program = Effect.void.pipe(
    Effect.provide(InputsLive),
    Effect.tapError((error: ExitError) => Effect.logFatal(error.title, ...error.messages)),
    Effect.provide(Logger.pretty),
)
