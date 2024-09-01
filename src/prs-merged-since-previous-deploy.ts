import { Effect } from 'effect'
import { ActionError } from './error-handling'
import { GithubClient } from './services/github-client'
import { Inputs } from './services/inputs'

export const pRsMergedSincePreviousDeploy = Effect.void.pipe(
    Effect.andThen(getWorkflowRuns),
    Effect.andThen(getComparisonWithPreviousDeploy),
    Effect.andThen(getCommitsBetweenCurrentAndPreviousDeploy),
    Effect.andThen(getMergedPrsForCommits),
    Effect.map((pullRequests) =>
        pullRequests.map((pullRequest) => ({
            url: pullRequest.html_url,
            title: pullRequest.title,
        })),
    ),
)

function getWorkflowRuns() {
    return GithubClient.pipe(
        Effect.andThen((githubClient) => githubClient.listWorkflowRuns()),
        Effect.tap((workflowRunsResponse) =>
            workflowRunsResponse.data.workflow_runs.length === 0
                ? Effect.fail(new ActionError({ title: 'No workflow runs found', exit: 'success' }))
                : Effect.logDebug(
                      `${workflowRunsResponse.data.total_count} total workflow runs found`,
                      `Processing first ${workflowRunsResponse.data.workflow_runs.length}`,
                  ),
        ),
        Effect.map((workflowRunsResponse) => workflowRunsResponse.data.workflow_runs),
    )
}

function getComparisonWithPreviousDeploy(
    workflowRuns: Effect.Effect.Success<ReturnType<typeof getWorkflowRuns>>,
) {
    return Effect.all(
        workflowRuns.map((workflowRun) =>
            wasDeploySuccessful(workflowRun).pipe(
                Effect.andThen((wasDeploySuccessful) =>
                    wasDeploySuccessful
                        ? getComparisonToDeployedCommitSha(workflowRun.head_sha)
                        : Effect.succeed(null),
                ),
            ),
        ),
        { concurrency: 'unbounded' },
    ).pipe(
        Effect.map((results) => results.filter((result) => result !== null)),
        Effect.tap((comparisons) =>
            comparisons.length === 0
                ? Effect.fail(
                      new ActionError({
                          title: 'No previous successful deploys found',
                          exit: 'success',
                      }),
                  )
                : Effect.void,
        ),
        Effect.map((comparisons) =>
            comparisons.reduce((closest, current) =>
                current.behind_by < closest.behind_by ? current : closest,
            ),
        ),
        Effect.tap((closestComparison) =>
            Effect.logDebug(
                `Closest comparison with commit ${closestComparison.merge_base_commit.sha.substring(0, 7)}`,
                `Status ${closestComparison.status}, behind by ${closestComparison.behind_by} and ahead by ${closestComparison.ahead_by}`,
            ),
        ),
    )
}

function wasDeploySuccessful(
    workflowRun: Effect.Effect.Success<ReturnType<typeof getWorkflowRuns>>[number],
) {
    const commitSha = workflowRun.head_sha
    const shortCommitSha = commitSha.substring(0, 7)

    if (workflowRun.conclusion === 'success') {
        return Effect.logDebug(
            `Workflow run at commit ${shortCommitSha} completed successfully`,
            'Processing commit further',
        ).pipe(Effect.map(() => true))
    }

    return Effect.all([GithubClient, Inputs]).pipe(
        Effect.andThen(([githubClient, inputs]) => {
            return githubClient.listJobsForWorkflowRun(workflowRun.id).pipe(
                Effect.map((jobsResponse) =>
                    jobsResponse.data.jobs.find((job) => job.name === inputs.workflowJobName),
                ),
                Effect.tap((job) =>
                    job
                        ? job.conclusion === 'success'
                            ? Effect.logDebug(
                                  `Job at commit ${shortCommitSha} completed successfully`,
                                  'Processing commit further',
                              )
                            : Effect.logDebug(
                                  `Job at commit ${shortCommitSha} did not complete successfully`,
                                  'Dropping commit',
                              )
                        : Effect.logDebug(
                              `Job with name ${inputs.workflowJobName} not found in workflow run at commit ${shortCommitSha}`,
                              'Dropping commit',
                          ),
                ),
                Effect.map((job) => job?.conclusion === 'success'),
            )
        }),
    )
}

function getComparisonToDeployedCommitSha(commitSha: string) {
    return GithubClient.pipe(
        Effect.andThen((githubClient) =>
            githubClient.compareToCurrentDeployCommit(commitSha).pipe(
                Effect.map((compareResponse) => compareResponse.data),
                Effect.tap((comparison) => {
                    const shortCommitSha = commitSha.substring(0, 7)

                    if (comparison.status === 'behind') {
                        return Effect.logDebug(
                            `Commit ${shortCommitSha} is behind deployed commit by ${comparison.behind_by} commits`,
                            'Processing commit further',
                        )
                    }

                    if (comparison.status === 'identical') {
                        return Effect.logDebug(
                            `Commit ${shortCommitSha} is identical to deployed commit`,
                            'Dropping commit',
                        )
                    }

                    if (comparison.status === 'diverged') {
                        return Effect.logDebug(
                            `Commit ${shortCommitSha} is diverged from deployed commit, ${comparison.ahead_by} ahead and ${comparison.behind_by} behind`,
                            'Dropping commit',
                        )
                    }

                    if (comparison.status === 'ahead') {
                        return Effect.logDebug(
                            `Commit ${shortCommitSha} is ahead of deployed commit by ${comparison.ahead_by} commits`,
                            'Dropping commit',
                        )
                    }
                }),
                Effect.map((comparison) => (comparison.status === 'behind' ? comparison : null)),
            ),
        ),
    )
}

function getCommitsBetweenCurrentAndPreviousDeploy(
    comparison: Effect.Effect.Success<ReturnType<typeof getComparisonWithPreviousDeploy>>,
) {
    return GithubClient.pipe(
        Effect.andThen((githubClient) => {
            const lastCommitSha = comparison.merge_base_commit.sha

            if (comparison.commits.length === comparison.behind_by) {
                return Effect.succeed({
                    commits: comparison.commits,
                    lastCommitSha,
                    lastCommitBehindBy: comparison.behind_by,
                })
            }

            if (comparison.behind_by >= 100) {
                return Effect.logDebug(
                    `Commit from closest comparison is too far behind, only checking last 100 commits`,
                ).pipe(
                    Effect.andThen(() =>
                        githubClient.listCommits(comparison.merge_base_commit.sha, 100),
                    ),
                    Effect.map((commitsResponse) => ({
                        commits: commitsResponse.data,
                        lastCommitSha,
                        lastCommitBehindBy: comparison.behind_by,
                    })),
                )
            }

            return githubClient
                .listCommits(comparison.base_commit.sha, comparison.behind_by + 1)
                .pipe(
                    Effect.map((commitsResponse) => ({
                        commits: commitsResponse.data,
                        lastCommitSha,
                        lastCommitBehindBy: comparison.behind_by,
                    })),
                )
        }),
        Effect.andThen(({ commits, lastCommitSha, lastCommitBehindBy }) => {
            const lastCommitIndex = commits.findIndex((commit) => commit.sha === lastCommitSha)

            if (lastCommitIndex === -1) {
                return Effect.logWarning(
                    `Could not find commit ${lastCommitSha} from last deployment that is behind by ${lastCommitBehindBy} commits`,
                    'Some associated pull requests may be left out',
                ).pipe(Effect.map(() => commits))
            }

            return Effect.succeed(commits.slice(0, lastCommitIndex))
        }),
        Effect.tap((commits) =>
            commits.length === 0
                ? Effect.fail(
                      new ActionError({
                          title: 'No commits found since previous deploy',
                          exit: 'success',
                      }),
                  )
                : Effect.logDebug(`${commits.length} commits found since previous deploy`),
        ),
    )
}

function getMergedPrsForCommits(
    commits: Effect.Effect.Success<ReturnType<typeof getCommitsBetweenCurrentAndPreviousDeploy>>,
) {
    return GithubClient.pipe(
        Effect.andThen((githubClient) =>
            Effect.all(
                commits.map((commit) =>
                    githubClient.listPullRequestsAssociatedWithCommit(commit.sha).pipe(
                        Effect.map((pullRequestsResponse) =>
                            pullRequestsResponse.data.filter(
                                (pullRequest) =>
                                    pullRequest.state === 'closed' &&
                                    pullRequest.merged_at?.length !== 0,
                            ),
                        ),
                        Effect.tap((pullRequests) =>
                            Effect.logDebug(
                                `${pullRequests.length} merged pull request${pullRequests.length === 1 ? '' : 's'} found associated with commit ${commit.sha.substring(0, 7)}`,
                            ),
                        ),
                    ),
                ),
                { concurrency: 'unbounded' },
            ),
        ),
        Effect.map((pullRequestsForCommits) => pullRequestsForCommits.flat()),
        Effect.map((pullRequestsWithDuplicates) => {
            const prMap = new Map(pullRequestsWithDuplicates.map((pr) => [pr.html_url, pr]))
            return Array.from(prMap.values())
        }),
        Effect.tap((pullRequests) =>
            Effect.logInfo(
                `Found ${pullRequests.length} pull request${pullRequests.length === 1 ? '' : 's'} associated with current deployment`,
                ...pullRequests.map(
                    (pullRequest) => `${pullRequest.html_url} → ${pullRequest.title}`,
                ),
            ),
        ),
    )
}
