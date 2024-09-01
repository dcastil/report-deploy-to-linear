import { LinearClient as LinearSdkClient } from '@linear/sdk'
import { Context, Effect, Layer, Redacted } from 'effect'

import { transformToActionError } from '../error-handling'
import { Inputs } from './inputs'

export class LinearClient extends Context.Tag('LinearClient')<
    LinearClient,
    Effect.Effect.Success<typeof linearClient>
>() {}

const linearClient = Inputs.pipe(
    Effect.andThen((inputs) => {
        const linear = new LinearSdkClient({
            apiKey:
                inputs.linearToken.type === 'personal-api-key'
                    ? Redacted.value(inputs.linearToken.token)
                    : undefined,
            accessToken:
                inputs.linearToken.type === 'oauth-access-token'
                    ? Redacted.value(inputs.linearToken.token)
                    : undefined,
        })

        function createCommentLive(issueId: string, body: string) {
            return Effect.tryPromise({
                try: () =>
                    linear
                        .createComment({
                            issueId,
                            body,
                            doNotSubscribeToIssue: true,
                        })
                        .then((response): void => {
                            if (!response.success) {
                                throw new Error('Request was not successful')
                            }
                        }),
                catch: transformToActionError(`Could not create comment for issue ${issueId}`),
            })
        }

        function createCommentDryRun(issueId: string, body: string) {
            return Effect.logInfo(`Dry run: Would have created comment for issue ${issueId}`, body)
        }

        return {
            getIssueViewForAttachmentUrl: (url: string, commentStartsWith: string) =>
                Effect.tryPromise({
                    try: () =>
                        linear.client.request(issueViewForAttachmentQuery, {
                            url,
                            commentStartsWith,
                        }) as Promise<IssueViewForAttachmentUrlQueryResponse>,
                    catch: transformToActionError(
                        `Could not get issue view for attachment URL ${url}`,
                    ),
                }),

            createComment: inputs.isDryRun ? createCommentDryRun : createCommentLive,
        }
    }),
)

export const LinearClientLive = Layer.effect(LinearClient, linearClient)

// Queries can be constructed in https://studio.apollographql.com/public/Linear-API/variant/current/explorer
const gql = String.raw

interface IssueViewForAttachmentUrlQueryResponse {
    data: {
        attachmentsForURL: {
            nodes: {
                issue: {
                    id: string
                    comments: {
                        nodes: {
                            id: string
                        }[]
                    }
                }
            }[]
        }
    }
}

const issueViewForAttachmentQuery = gql`
    query IssueViewForAttachmentUrl($url: String!, $$commentStartsWith: String!) {
        attachmentsForURL(url: $url) {
            nodes {
                issue {
                    id
                    comments(filter: { body: { startsWith: $commentStartsWith } }, first: 1, , orderBy: createdAt) {
                        nodes {
                            id
                        }
                    }
                }
            }
        }
    }
`

export function getLinearClientTest(client?: Partial<Effect.Effect.Success<typeof linearClient>>) {
    return Layer.succeed(
        LinearClient,
        LinearClient.of({
            getIssueViewForAttachmentUrl: (url: string, commentStartsWith: string) =>
                Effect.promise(() =>
                    Promise.resolve({
                        data: {
                            attachmentsForURL: {
                                nodes: [
                                    {
                                        issue: {
                                            id: '87d696f1-4467-4f35-843e-c62b31b26' + url.slice(-3),
                                            comments: {
                                                nodes: [],
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    }),
                ),
            createComment: () => Effect.promise(Promise.resolve),
            ...client,
        }),
    )
}
