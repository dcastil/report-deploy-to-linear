import { Effect } from 'effect'
import { expect, test } from 'vitest'
import { createProgram } from './program'
import { runMainTest } from './run-main'
import { getConfigProviderTest } from './services/config-provider'
import { getGitHubClientTest } from './services/github-client'

test('runs without errors', () => {
    createProgram({
        configProvider: getConfigProviderTest(),
        githubClient: getGitHubClientTest(),
    }).pipe(runMainTest)
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
    ).rejects.toThrowError('There was a fatal error with an input')
})
