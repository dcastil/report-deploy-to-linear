import { Effect } from 'effect'
import { expect, test } from 'vitest'
import { createProgram } from './program'
import { getConfigProviderTest } from './services/config-provider'
import { getGitHubClientTest } from './services/github-client'
import { getLinearClientTest } from './services/linear-client'

test('runs without errors', () => {
    return createProgram({
        configProvider: getConfigProviderTest({
            'log-level': 'off',
        }),
        githubClient: getGitHubClientTest(),
        linearClient: getLinearClientTest(),
    }).pipe(Effect.runPromise)
})

test('throws an error on missing inputs', () => {
    expect(() =>
        createProgram({
            configProvider: getConfigProviderTest({
                'dry-run': undefined,
                'log-level': 'off',
            }),
            githubClient: getGitHubClientTest(),
            linearClient: getLinearClientTest(),
        }).pipe(Effect.runPromise),
    ).rejects.toThrowError('There was an error with an input')
})
