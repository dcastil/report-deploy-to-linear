import { NodeRuntime } from '@effect/platform-node'
import { Effect } from 'effect'
import { program } from './program'
import { ConfigProviderLive } from './services/config-provider'

program.pipe(Effect.provide(ConfigProviderLive), NodeRuntime.runMain)
