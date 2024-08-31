import github from '@actions/github'
import { Context, Effect, Layer, Redacted } from 'effect'

import { Inputs } from './inputs'

export class GithubClient extends Context.Tag('Inputs')<
    GithubClient,
    Effect.Effect.Success<typeof githubClient>
>() {}

const githubClient = Inputs.pipe(
    Effect.andThen((inputs) => {
        const octokit = github.getOctokit(Redacted.value(inputs.githubToken))

        return {}
    }),
)

export const GithubClientLive = Layer.effect(GithubClient, githubClient)

export function getGitHubClientTest(client?: Partial<Effect.Effect.Success<typeof githubClient>>) {
    return Layer.succeed(
        GithubClient,
        GithubClient.of({
            ...client,
        }),
    )
}
