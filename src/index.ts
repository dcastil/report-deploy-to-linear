import { createProgram } from './program'
import { runMainLive } from './run-main'
import { ConfigProviderLive } from './services/config-provider'
import { GithubClientLive } from './services/github-client'
import { LinearClientLive } from './services/linear-client'

createProgram({
    configProvider: ConfigProviderLive,
    githubClient: GithubClientLive,
    linearClient: LinearClientLive,
}).pipe(runMainLive)
