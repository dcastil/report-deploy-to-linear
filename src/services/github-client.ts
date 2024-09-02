import fs from 'node:fs/promises'

import * as github from '@actions/github'
import { Context, Effect, Layer, Redacted } from 'effect'

import { ActionError, transformToActionError } from '../error-handling'
import { tapLogTrace } from '../utils'
import { Inputs } from './inputs'

export class GithubClient extends Context.Tag('GithubClient')<
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
                            per_page: 10,
                        }),
                    catch: transformToActionError('Could not list workflow runs'),
                }).pipe(tapLogTrace('GitHub listWorkflowRuns response')),

            listJobsForWorkflowRun: (runId: number) =>
                Effect.tryPromise({
                    try: () =>
                        octokit.rest.actions.listJobsForWorkflowRun({
                            ...inputs.workflowRepository,
                            run_id: runId,
                        }),
                    catch: transformToActionError(`Could not list jobs for workflow run ${runId}`),
                }).pipe(tapLogTrace(`GitHub listJobsForWorkflowRun with runId ${runId} response`)),

            compareToCurrentDeployCommit: (head: string) =>
                Effect.tryPromise({
                    try: () =>
                        octokit.rest.repos.compareCommitsWithBasehead({
                            ...inputs.workflowRepository,
                            basehead: `${inputs.deployedCommitSha}...${head}`,
                        }),
                    catch: transformToActionError(
                        `Could not compare commits ${inputs.deployedCommitSha}...${head}`,
                    ),
                }).pipe(
                    tapLogTrace(`GitHub compareToCurrentDeployCommit with head ${head} response`),
                ),

            listCommits: (sha: string, perPage?: number) =>
                Effect.tryPromise({
                    try: () =>
                        octokit.rest.repos.listCommits({
                            ...inputs.workflowRepository,
                            sha,
                            per_page: perPage,
                        }),
                    catch: transformToActionError(`Could not list commits for SHA ${sha}`),
                }).pipe(
                    tapLogTrace(
                        `GitHub listCommits with sha ${sha} and perPage ${perPage} response`,
                    ),
                ),

            listPullRequestsAssociatedWithCommit: (commitSha: string) =>
                Effect.tryPromise({
                    try: () =>
                        octokit.rest.repos.listPullRequestsAssociatedWithCommit({
                            ...inputs.workflowRepository,
                            commit_sha: commitSha,
                        }),
                    catch: transformToActionError(
                        `Could not list pull requests associated with commit ${commitSha}`,
                    ),
                }).pipe(
                    tapLogTrace(
                        `GitHub listPullRequestsAssociatedWithCommit with commitSha ${commitSha} response`,
                    ),
                ),
        } satisfies Record<string, (...args: any[]) => Effect.Effect<object, ActionError>>
    }),
)

export const GithubClientLive = Layer.effect(GithubClient, githubClient)

export function getGitHubClientTest(client?: Partial<Effect.Effect.Success<typeof githubClient>>) {
    return Layer.succeed(
        GithubClient,
        GithubClient.of({
            ...wrapTestResponses('read', {
                listWorkflowRuns: null!,
                listJobsForWorkflowRun: null!,
                compareToCurrentDeployCommit: null!,
                listCommits: null!,
                listPullRequestsAssociatedWithCommit: null!,
            }),
            ...client,
        }),
    )
}

function wrapTestResponses<
    const T extends Record<string, (...args: any[]) => Effect.Effect<any, ActionError>>,
>(mode: 'read' | 'write', functions: T): T {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('wrapTestResponses should only be used in test mode')
    }

    function wrapRead(functionName: string) {
        return (...args: any[]) => {
            const fileName = getFileName(functionName, args)

            return Effect.tryPromise({
                try: () =>
                    fs
                        .readFile(__dirname + '/github-client-test-responses/' + fileName, 'utf-8')
                        .then(JSON.parse),
                catch: transformToActionError(`Could not read test file ${fileName}`),
            })
        }
    }

    function wrapWrite(
        functionName: string,
        func: (...args: any[]) => Effect.Effect<any, ActionError>,
    ) {
        return (...args: any[]) =>
            func(...args).pipe(
                Effect.tap((response) => {
                    const fileName = getFileName(functionName, args)

                    return Effect.tryPromise({
                        try: () => {
                            const redactedKeys = new Set(['headers', 'verification', 'email'])

                            const stringifiedReponse = JSON.stringify(
                                response,
                                (key, value) => {
                                    if (redactedKeys.has(key)) {
                                        if (typeof value === 'object' && value !== null) {
                                            return { '<redacted>': true }
                                        }

                                        if (typeof value === 'string') {
                                            return '<redacted>'
                                        }

                                        if (typeof value === 'number') {
                                            return Math.floor(Math.random() * 10 ** 7)
                                        }

                                        return undefined
                                    }

                                    return value
                                },
                                4,
                            )

                            return fs.writeFile(
                                __dirname + '/github-client-test-responses/' + fileName,
                                stringifiedReponse,
                            )
                        },
                        catch: transformToActionError(`Could not write test file ${fileName}`),
                    })
                }),
            )
    }

    function getFileName(functionName: string, args: any[]) {
        return [functionName, ...args.map((arg) => '[' + arg + ']')].join('-') + '.json'
    }

    return Object.fromEntries(
        Object.entries(functions).map(([functionName, func]) => [
            functionName,
            mode === 'write' ? wrapWrite(functionName, func) : wrapRead(functionName),
        ]),
    ) as T
}
