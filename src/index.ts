import { Effect } from 'effect'
import { program } from './program'
import { runMainLive } from './run-main'
import { ConfigProviderLive } from './services/config-provider'

program.pipe(Effect.provide(ConfigProviderLive), runMainLive)
