import { Effect } from 'effect'
import { expect, test } from 'vitest'
import { program } from './program'
import { runMainTest } from './run-main'
import { getConfigProviderTest } from './services/config-provider'

test('runs without errors', () => {
    program.pipe(
        Effect.provide(
            getConfigProviderTest({
                'github-token': 'test-token',
                'deployed-commit-sha': 'ffac537e6cbbf934b08745a378932722df287a53',
                'workflow-file-name':
                    'octocat/hello-world/.github/workflows/my-workflow.yml@refs/heads/my_branch',
                'workflow-job-name': 'my-job',
                'dry-run': true,
            }),
        ),
        runMainTest,
    )
})

test('throws an error on missing inputs', () => {
    expect(() =>
        program.pipe(
            Effect.provide(
                getConfigProviderTest({
                    'github-token': 'test-token',
                    'deployed-commit-sha': 'ffac537e6cbbf934b08745a378932722df287a53',
                    'workflow-file-name':
                        'octocat/hello-world/.github/workflows/my-workflow.yml@refs/heads/my_branch',
                    'workflow-job-name': 'my-job',
                }),
            ),
            Effect.runSync,
        ),
    ).toThrowError('There was an error with an input.')
})
