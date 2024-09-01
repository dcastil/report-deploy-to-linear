import { Effect } from 'effect'
import { expect, test } from 'vitest'
import { createProgram } from './program'
import { getConfigProviderTest } from './services/config-provider'
import { getGitHubClientTest } from './services/github-client'

test('runs without errors', () => {
    return createProgram({
        configProvider: getConfigProviderTest({
            'log-level': 'off',
        }),
        githubClient: getGitHubClientTest(),
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
        }).pipe(Effect.runPromise),
    ).rejects.toThrowError('There was an error with an input')
})
