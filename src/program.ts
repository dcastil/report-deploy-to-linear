import { Effect } from 'effect'
import { InputsLive } from './services/inputs'

export const program = Effect.logInfo('Hello world!').pipe(Effect.provide(InputsLive))
