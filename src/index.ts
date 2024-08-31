import { createProgram } from './program'
import { runMainLive } from './run-main'
import { ConfigProviderLive } from './services/config-provider'
import { GithubClientLive } from './services/github-client'

createProgram({
    configProvider: ConfigProviderLive,
    githubClient: GithubClientLive,
}).pipe(runMainLive)
