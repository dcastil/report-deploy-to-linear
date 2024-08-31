import github from '@actions/github'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
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
                            per_page: 10,
                        }),
                    catch: transformToActionError('Could not list workflow runs'),
                }),
            listJobsForWorkflowRun: (runId: number) =>
                Effect.tryPromise({
                    try: () =>
                        octokit.rest.actions.listJobsForWorkflowRun({
                            ...inputs.workflowRepository,
                            run_id: runId,
                        }),
                    catch: transformToActionError('Could not list jobs for workflow run'),
                }),
        } satisfies Record<string, (...args: any[]) => Effect.Effect<object, ActionError>>
    }),
)

export const GithubClientLive = Layer.effect(GithubClient, githubClient)

export function getGitHubClientTest(client?: Partial<Effect.Effect.Success<typeof githubClient>>) {
    return Layer.succeed(
        GithubClient,
        GithubClient.of({
            listWorkflowRuns: getTestResponse('listWorkflowRuns'),
            listJobsForWorkflowRun: getTestResponse('listJobsForWorkflowRun'),
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

function getTestResponse<Key extends keyof typeof defaultTestResponses>(
    key: Key,
): () => Effect.Effect<(typeof defaultTestResponses)[Key]> {
    return () => Effect.promise(() => Promise.resolve(defaultTestResponses[key]))
}

const defaultTestResponses = {
    listWorkflowRuns: {
        url: 'https://api.github.com/repos/octocat/hello-world/actions/workflows/my-workflow.yml/runs',
        status: 200,
        headers: {},
        data: {
            total_count: 1,
            workflow_runs: [
                {
                    id: 30433642,
                    name: 'Build',
                    node_id: 'MDEyOldvcmtmbG93IFJ1bjI2OTI4OQ==',
                    check_suite_id: 42,
                    check_suite_node_id: 'MDEwOkNoZWNrU3VpdGU0Mg==',
                    head_branch: 'master',
                    head_sha: 'acb5820ced9479c074f688cc328bf03f341a511d',
                    path: '.github/workflows/build.yml@main',
                    run_number: 562,
                    event: 'push',
                    display_title: 'Update README.md',
                    status: 'queued',
                    conclusion: null,
                    workflow_id: 159038,
                    url: 'https://api.github.com/repos/octo-org/octo-repo/actions/runs/30433642',
                    html_url: 'https://github.com/octo-org/octo-repo/actions/runs/30433642',
                    pull_requests: [],
                    created_at: '2020-01-22T19:33:08Z',
                    updated_at: '2020-01-22T19:33:08Z',
                    actor: {
                        login: 'octocat',
                        id: 1,
                        node_id: 'MDQ6VXNlcjE=',
                        avatar_url: 'https://github.com/images/error/octocat_happy.gif',
                        gravatar_id: '',
                        url: 'https://api.github.com/users/octocat',
                        html_url: 'https://github.com/octocat',
                        followers_url: 'https://api.github.com/users/octocat/followers',
                        following_url:
                            'https://api.github.com/users/octocat/following{/other_user}',
                        gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
                        starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                        subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
                        organizations_url: 'https://api.github.com/users/octocat/orgs',
                        repos_url: 'https://api.github.com/users/octocat/repos',
                        events_url: 'https://api.github.com/users/octocat/events{/privacy}',
                        received_events_url: 'https://api.github.com/users/octocat/received_events',
                        type: 'User',
                        site_admin: false,
                    },
                    run_attempt: 1,
                    run_started_at: '2020-01-22T19:33:08Z',
                    triggering_actor: {
                        login: 'octocat',
                        id: 1,
                        node_id: 'MDQ6VXNlcjE=',
                        avatar_url: 'https://github.com/images/error/octocat_happy.gif',
                        gravatar_id: '',
                        url: 'https://api.github.com/users/octocat',
                        html_url: 'https://github.com/octocat',
                        followers_url: 'https://api.github.com/users/octocat/followers',
                        following_url:
                            'https://api.github.com/users/octocat/following{/other_user}',
                        gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
                        starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                        subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
                        organizations_url: 'https://api.github.com/users/octocat/orgs',
                        repos_url: 'https://api.github.com/users/octocat/repos',
                        events_url: 'https://api.github.com/users/octocat/events{/privacy}',
                        received_events_url: 'https://api.github.com/users/octocat/received_events',
                        type: 'User',
                        site_admin: false,
                    },
                    jobs_url:
                        'https://api.github.com/repos/octo-org/octo-repo/actions/runs/30433642/jobs',
                    logs_url:
                        'https://api.github.com/repos/octo-org/octo-repo/actions/runs/30433642/logs',
                    check_suite_url:
                        'https://api.github.com/repos/octo-org/octo-repo/check-suites/414944374',
                    artifacts_url:
                        'https://api.github.com/repos/octo-org/octo-repo/actions/runs/30433642/artifacts',
                    cancel_url:
                        'https://api.github.com/repos/octo-org/octo-repo/actions/runs/30433642/cancel',
                    rerun_url:
                        'https://api.github.com/repos/octo-org/octo-repo/actions/runs/30433642/rerun',
                    workflow_url:
                        'https://api.github.com/repos/octo-org/octo-repo/actions/workflows/159038',
                    head_commit: {
                        id: 'acb5820ced9479c074f688cc328bf03f341a511d',
                        tree_id: 'd23f6eedb1e1b9610bbc754ddb5197bfe7271223',
                        message: 'Create linter.yaml',
                        timestamp: '2020-01-22T19:33:05Z',
                        author: {
                            name: 'Octo Cat',
                            email: 'octocat@github.com',
                        },
                        committer: {
                            name: 'GitHub',
                            email: 'noreply@github.com',
                        },
                    },
                    repository: {
                        id: 1296269,
                        node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
                        name: 'Hello-World',
                        full_name: 'octocat/Hello-World',
                        owner: {
                            login: 'octocat',
                            id: 1,
                            node_id: 'MDQ6VXNlcjE=',
                            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
                            gravatar_id: '',
                            url: 'https://api.github.com/users/octocat',
                            html_url: 'https://github.com/octocat',
                            followers_url: 'https://api.github.com/users/octocat/followers',
                            following_url:
                                'https://api.github.com/users/octocat/following{/other_user}',
                            gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
                            starred_url:
                                'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                            subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
                            organizations_url: 'https://api.github.com/users/octocat/orgs',
                            repos_url: 'https://api.github.com/users/octocat/repos',
                            events_url: 'https://api.github.com/users/octocat/events{/privacy}',
                            received_events_url:
                                'https://api.github.com/users/octocat/received_events',
                            type: 'User',
                            site_admin: false,
                        },
                        private: false,
                        html_url: 'https://github.com/octocat/Hello-World',
                        description: 'This your first repo!',
                        fork: false,
                        url: 'https://api.github.com/repos/octocat/Hello-World',
                        archive_url:
                            'https://api.github.com/repos/octocat/Hello-World/{archive_format}{/ref}',
                        assignees_url:
                            'https://api.github.com/repos/octocat/Hello-World/assignees{/user}',
                        blobs_url:
                            'https://api.github.com/repos/octocat/Hello-World/git/blobs{/sha}',
                        branches_url:
                            'https://api.github.com/repos/octocat/Hello-World/branches{/branch}',
                        collaborators_url:
                            'https://api.github.com/repos/octocat/Hello-World/collaborators{/collaborator}',
                        comments_url:
                            'https://api.github.com/repos/octocat/Hello-World/comments{/number}',
                        commits_url:
                            'https://api.github.com/repos/octocat/Hello-World/commits{/sha}',
                        compare_url:
                            'https://api.github.com/repos/octocat/Hello-World/compare/{base}...{head}',
                        contents_url:
                            'https://api.github.com/repos/octocat/Hello-World/contents/{+path}',
                        contributors_url:
                            'https://api.github.com/repos/octocat/Hello-World/contributors',
                        deployments_url:
                            'https://api.github.com/repos/octocat/Hello-World/deployments',
                        downloads_url: 'https://api.github.com/repos/octocat/Hello-World/downloads',
                        events_url: 'https://api.github.com/repos/octocat/Hello-World/events',
                        forks_url: 'https://api.github.com/repos/octocat/Hello-World/forks',
                        git_commits_url:
                            'https://api.github.com/repos/octocat/Hello-World/git/commits{/sha}',
                        git_refs_url:
                            'https://api.github.com/repos/octocat/Hello-World/git/refs{/sha}',
                        git_tags_url:
                            'https://api.github.com/repos/octocat/Hello-World/git/tags{/sha}',
                        git_url: 'git:github.com/octocat/Hello-World.git',
                        issue_comment_url:
                            'https://api.github.com/repos/octocat/Hello-World/issues/comments{/number}',
                        issue_events_url:
                            'https://api.github.com/repos/octocat/Hello-World/issues/events{/number}',
                        issues_url:
                            'https://api.github.com/repos/octocat/Hello-World/issues{/number}',
                        keys_url: 'https://api.github.com/repos/octocat/Hello-World/keys{/key_id}',
                        labels_url:
                            'https://api.github.com/repos/octocat/Hello-World/labels{/name}',
                        languages_url: 'https://api.github.com/repos/octocat/Hello-World/languages',
                        merges_url: 'https://api.github.com/repos/octocat/Hello-World/merges',
                        milestones_url:
                            'https://api.github.com/repos/octocat/Hello-World/milestones{/number}',
                        notifications_url:
                            'https://api.github.com/repos/octocat/Hello-World/notifications{?since,all,participating}',
                        pulls_url:
                            'https://api.github.com/repos/octocat/Hello-World/pulls{/number}',
                        releases_url:
                            'https://api.github.com/repos/octocat/Hello-World/releases{/id}',
                        ssh_url: 'git@github.com:octocat/Hello-World.git',
                        stargazers_url:
                            'https://api.github.com/repos/octocat/Hello-World/stargazers',
                        statuses_url:
                            'https://api.github.com/repos/octocat/Hello-World/statuses/{sha}',
                        subscribers_url:
                            'https://api.github.com/repos/octocat/Hello-World/subscribers',
                        subscription_url:
                            'https://api.github.com/repos/octocat/Hello-World/subscription',
                        tags_url: 'https://api.github.com/repos/octocat/Hello-World/tags',
                        teams_url: 'https://api.github.com/repos/octocat/Hello-World/teams',
                        trees_url:
                            'https://api.github.com/repos/octocat/Hello-World/git/trees{/sha}',
                        hooks_url: 'http://api.github.com/repos/octocat/Hello-World/hooks',
                    },
                    head_repository: {
                        id: 217723378,
                        node_id: 'MDEwOlJlcG9zaXRvcnkyMTc3MjMzNzg=',
                        name: 'octo-repo',
                        full_name: 'octo-org/octo-repo',
                        private: true,
                        owner: {
                            login: 'octocat',
                            id: 1,
                            node_id: 'MDQ6VXNlcjE=',
                            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
                            gravatar_id: '',
                            url: 'https://api.github.com/users/octocat',
                            html_url: 'https://github.com/octocat',
                            followers_url: 'https://api.github.com/users/octocat/followers',
                            following_url:
                                'https://api.github.com/users/octocat/following{/other_user}',
                            gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
                            starred_url:
                                'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                            subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
                            organizations_url: 'https://api.github.com/users/octocat/orgs',
                            repos_url: 'https://api.github.com/users/octocat/repos',
                            events_url: 'https://api.github.com/users/octocat/events{/privacy}',
                            received_events_url:
                                'https://api.github.com/users/octocat/received_events',
                            type: 'User',
                            site_admin: false,
                        },
                        html_url: 'https://github.com/octo-org/octo-repo',
                        description: null,
                        fork: false,
                        url: 'https://api.github.com/repos/octo-org/octo-repo',
                        forks_url: 'https://api.github.com/repos/octo-org/octo-repo/forks',
                        keys_url: 'https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}',
                        collaborators_url:
                            'https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}',
                        teams_url: 'https://api.github.com/repos/octo-org/octo-repo/teams',
                        hooks_url: 'https://api.github.com/repos/octo-org/octo-repo/hooks',
                        issue_events_url:
                            'https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}',
                        events_url: 'https://api.github.com/repos/octo-org/octo-repo/events',
                        assignees_url:
                            'https://api.github.com/repos/octo-org/octo-repo/assignees{/user}',
                        branches_url:
                            'https://api.github.com/repos/octo-org/octo-repo/branches{/branch}',
                        tags_url: 'https://api.github.com/repos/octo-org/octo-repo/tags',
                        blobs_url:
                            'https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}',
                        git_tags_url:
                            'https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}',
                        git_refs_url:
                            'https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}',
                        trees_url:
                            'https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}',
                        statuses_url:
                            'https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}',
                        languages_url: 'https://api.github.com/repos/octo-org/octo-repo/languages',
                        stargazers_url:
                            'https://api.github.com/repos/octo-org/octo-repo/stargazers',
                        contributors_url:
                            'https://api.github.com/repos/octo-org/octo-repo/contributors',
                        subscribers_url:
                            'https://api.github.com/repos/octo-org/octo-repo/subscribers',
                        subscription_url:
                            'https://api.github.com/repos/octo-org/octo-repo/subscription',
                        commits_url:
                            'https://api.github.com/repos/octo-org/octo-repo/commits{/sha}',
                        git_commits_url:
                            'https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}',
                        comments_url:
                            'https://api.github.com/repos/octo-org/octo-repo/comments{/number}',
                        issue_comment_url:
                            'https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}',
                        contents_url:
                            'https://api.github.com/repos/octo-org/octo-repo/contents/{+path}',
                        compare_url:
                            'https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}',
                        merges_url: 'https://api.github.com/repos/octo-org/octo-repo/merges',
                        archive_url:
                            'https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}',
                        downloads_url: 'https://api.github.com/repos/octo-org/octo-repo/downloads',
                        issues_url:
                            'https://api.github.com/repos/octo-org/octo-repo/issues{/number}',
                        pulls_url: 'https://api.github.com/repos/octo-org/octo-repo/pulls{/number}',
                        milestones_url:
                            'https://api.github.com/repos/octo-org/octo-repo/milestones{/number}',
                        notifications_url:
                            'https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}',
                        labels_url: 'https://api.github.com/repos/octo-org/octo-repo/labels{/name}',
                        releases_url:
                            'https://api.github.com/repos/octo-org/octo-repo/releases{/id}',
                        deployments_url:
                            'https://api.github.com/repos/octo-org/octo-repo/deployments',
                    },
                },
            ],
        },
    } satisfies RestEndpointMethodTypes['actions']['listWorkflowRuns']['response'],
    listJobsForWorkflowRun: {
        url: 'https://api.github.com/repos/octo-org/octo-repo/actions/runs/29679449/jobs',
        status: 200,
        headers: {},
        data: {
            total_count: 1,
            jobs: [
                {
                    id: 399444496,
                    run_id: 29679449,
                    run_url:
                        'https://api.github.com/repos/octo-org/octo-repo/actions/runs/29679449',
                    node_id: 'MDEyOldvcmtmbG93IEpvYjM5OTQ0NDQ5Ng==',
                    head_sha: 'f83a356604ae3c5d03e1b46ef4d1ca77d64a90b0',
                    url: 'https://api.github.com/repos/octo-org/octo-repo/actions/jobs/399444496',
                    html_url: 'https://github.com/octo-org/octo-repo/runs/29679449/jobs/399444496',
                    status: 'completed',
                    conclusion: 'success',
                    created_at: '2020-01-20T17:40:09Z',
                    started_at: '2020-01-20T17:42:40Z',
                    completed_at: '2020-01-20T17:44:39Z',
                    name: 'build',
                    steps: [
                        {
                            name: 'Set up job',
                            status: 'completed',
                            conclusion: 'success',
                            number: 1,
                            started_at: '2020-01-20T09:42:40.000-08:00',
                            completed_at: '2020-01-20T09:42:41.000-08:00',
                        },
                        {
                            name: 'Run actions/checkout@v2',
                            status: 'completed',
                            conclusion: 'success',
                            number: 2,
                            started_at: '2020-01-20T09:42:41.000-08:00',
                            completed_at: '2020-01-20T09:42:45.000-08:00',
                        },
                        {
                            name: 'Set up Ruby',
                            status: 'completed',
                            conclusion: 'success',
                            number: 3,
                            started_at: '2020-01-20T09:42:45.000-08:00',
                            completed_at: '2020-01-20T09:42:45.000-08:00',
                        },
                        {
                            name: 'Run actions/cache@v3',
                            status: 'completed',
                            conclusion: 'success',
                            number: 4,
                            started_at: '2020-01-20T09:42:45.000-08:00',
                            completed_at: '2020-01-20T09:42:48.000-08:00',
                        },
                        {
                            name: 'Install Bundler',
                            status: 'completed',
                            conclusion: 'success',
                            number: 5,
                            started_at: '2020-01-20T09:42:48.000-08:00',
                            completed_at: '2020-01-20T09:42:52.000-08:00',
                        },
                        {
                            name: 'Install Gems',
                            status: 'completed',
                            conclusion: 'success',
                            number: 6,
                            started_at: '2020-01-20T09:42:52.000-08:00',
                            completed_at: '2020-01-20T09:42:53.000-08:00',
                        },
                        {
                            name: 'Run Tests',
                            status: 'completed',
                            conclusion: 'success',
                            number: 7,
                            started_at: '2020-01-20T09:42:53.000-08:00',
                            completed_at: '2020-01-20T09:42:59.000-08:00',
                        },
                        {
                            name: 'Deploy to Heroku',
                            status: 'completed',
                            conclusion: 'success',
                            number: 8,
                            started_at: '2020-01-20T09:42:59.000-08:00',
                            completed_at: '2020-01-20T09:44:39.000-08:00',
                        },
                        {
                            name: 'Post actions/cache@v3',
                            status: 'completed',
                            conclusion: 'success',
                            number: 16,
                            started_at: '2020-01-20T09:44:39.000-08:00',
                            completed_at: '2020-01-20T09:44:39.000-08:00',
                        },
                        {
                            name: 'Complete job',
                            status: 'completed',
                            conclusion: 'success',
                            number: 17,
                            started_at: '2020-01-20T09:44:39.000-08:00',
                            completed_at: '2020-01-20T09:44:39.000-08:00',
                        },
                    ],
                    check_run_url:
                        'https://api.github.com/repos/octo-org/octo-repo/check-runs/399444496',
                    labels: ['self-hosted', 'foo', 'bar'],
                    runner_id: 1,
                    runner_name: 'my runner',
                    runner_group_id: 2,
                    runner_group_name: 'my runner group',
                    workflow_name: 'CI',
                    head_branch: 'main',
                },
            ],
        },
    } satisfies RestEndpointMethodTypes['actions']['listJobsForWorkflowRun']['response'],
}
