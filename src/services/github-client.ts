import github from '@actions/github'
import { Context, Effect, Layer, Redacted } from 'effect'

import { ActionError } from '../error-handling'
import { Inputs } from './inputs'

export class GithubClient extends Context.Tag('Inputs')<
    GithubClient,
    Effect.Effect.Success<typeof githubClient>
>() {}

const githubClient = Inputs.pipe(
    Effect.andThen((inputs) => {
        const octokit = github.getOctokit(Redacted.value(inputs.githubToken))

        return {
            listWorkflowRuns: () =>
                Effect.tryPromise({
                    try: () =>
                        octokit.rest.actions.listWorkflowRuns({
                            ...inputs.workflowRepository,
                            workflow_id: inputs.workflowFileName,
                        }),
                    catch: transformToActionError('Could not list workflow runs'),
                }),
        } satisfies Record<string, (...args: any[]) => Effect.Effect<object, ActionError>>
    }),
)

export const GithubClientLive = Layer.effect(GithubClient, githubClient)

export function getGitHubClientTest(client?: Partial<Effect.Effect.Success<typeof githubClient>>) {
    return Layer.succeed(
        GithubClient,
        GithubClient.of({
            listWorkflowRuns: () =>
                Effect.promise(() =>
                    Promise.resolve({
                        url: 'https://api.github.com/repos/octocat/hello-world/actions/workflows/my-workflow.yml/runs',
                        status: 200,
                        headers: {},
                        data: {
                            total_count: 0,
                            workflow_runs: [],
                        },
                    }),
                ),
            ...client,
        }),
    )
}

function transformToActionError(title: string) {
    return (error: unknown) => {
        if (error instanceof Error) {
            return new ActionError({
                title,
                messages: [error.message],
                cause: error,
            })
        }

        return new ActionError({
            title,
            messages: [error],
            cause: error,
        })
    }
}
