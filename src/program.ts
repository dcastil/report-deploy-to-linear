import { Effect } from 'effect'
import { FatalError } from './error-handling'
import { InputsLive } from './services/inputs'
import { LoggerLive } from './services/logger'

export const program = Effect.void.pipe(
    Effect.provide(InputsLive),
    Effect.tapBoth({
        onSuccess: () => Effect.logInfo('Action completed successfully'),
        onFailure: (error: FatalError) =>
            Effect.logFatal(error.title, ...error.messages).pipe(
                Effect.andThen(Effect.logInfo('Action aborted')),
            ),
    }),
    Effect.tapDefect((defect) => Effect.logFatal('Action died unexpectedly', defect)),
    Effect.provide(LoggerLive),
)
