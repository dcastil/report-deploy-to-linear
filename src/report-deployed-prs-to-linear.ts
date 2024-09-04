import { Effect } from 'effect'
import { Inputs } from './services/inputs'
import { LinearClient } from './services/linear-client'

interface PullRequest {
    url: string
    title: string
}

export function reportDeployedPrsToLinear(pullRequests: PullRequest[]) {
    return LinearClient.pipe(
        Effect.andThen((linearClient) =>
            Effect.all(
                pullRequests.map((pullRequest) =>
                    getCommentBody(pullRequest).pipe(
                        Effect.andThen((commentBody) =>
                            linearClient
                                .getIssueViewForAttachmentUrl(pullRequest.url, commentBody)
                                .pipe(
                                    Effect.map((issueView) => issueView.attachmentsForURL.nodes),
                                    Effect.tap((attachments) =>
                                        attachments.length === 0
                                            ? Effect.logInfo(
                                                  `No Linear attachments found for pull request ${pullRequest.url}`,
                                              )
                                            : Effect.logDebug(
                                                  `${attachments.length} Linear attachment${attachments.length === 1 ? '' : 's'} found for pull request ${pullRequest.url}`,
                                                  `Belonging to issue${attachments.length === 1 ? '' : 's'} ${attachments.map((attachment) => attachment.issue.identifier).join(', ')}`,
                                              ),
                                    ),
                                    Effect.andThen((attachments) =>
                                        Effect.all(
                                            attachments.map((attachment) =>
                                                attachment.issue.comments.nodes.length === 0
                                                    ? linearClient
                                                          .createComment(
                                                              attachment.issue.id,
                                                              commentBody,
                                                          )
                                                          .pipe(
                                                              Effect.andThen(() =>
                                                                  Effect.logInfo(
                                                                      `Added comment to issue ${attachment.issue.identifier}`,
                                                                      'Comment body:',
                                                                      commentBody,
                                                                  ),
                                                              ),
                                                          )
                                                    : Effect.logInfo(
                                                          `Not adding comment to issue ${attachment.issue.identifier} because it already has deploy comment`,
                                                          'Comment body:',
                                                          commentBody,
                                                      ),
                                            ),
                                            { concurrency: 'unbounded' },
                                        ),
                                    ),
                                ),
                        ),
                    ),
                ),
                { concurrency: 'unbounded' },
            ),
        ),
    )
}

function getCommentBody(pullRequest: PullRequest) {
    return Inputs.pipe(
        Effect.map((inputs) =>
            inputs.linearCommentBody.replace(/{{\s*(.+?)\s*}}/g, (match, captureGroup: string) => {
                if (captureGroup === 'pullRequest.url') {
                    return pullRequest.url
                }

                if (captureGroup === 'pullRequest.title') {
                    return pullRequest.title
                }

                return match
            }),
        ),
    )
}
