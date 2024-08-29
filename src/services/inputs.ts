import { Config, ConfigError, Context, Effect, Layer } from 'effect'
import { isInvalidData, isMissingData } from 'effect/ConfigError'
import { objectEntriesUnsafe } from '../utils'

class Inputs extends Context.Tag('Inputs')<Inputs, Effect.Effect.Success<typeof inputs>>() {}

const inputs = validateConfig({
    githubToken: Config.redacted('github-token'),

    deployedCommitSha: Config.string('deployed-commit-sha'),

    workflowFileName: Config.string('workflow-file-name').pipe(
        Config.mapAttempt((value) => {
            const match = /^.*?([^/]+\.ya?ml)(@.+)?$/.exec(value)

            if (!match) {
                throw new Error(`Could not parse file name (received "${value}")`)
            }

            return match[1]!
        }),
    ),

    workflowJobName: Config.string('workflow-job-name'),

    isDryRun: Config.boolean('dry-run'),
})

export const InputsLive = Layer.effect(
    Inputs,
    inputs.pipe(
        Effect.mapError((configErrors) => {
            if (configErrors.length === 1) {
                return new Error('')
            }

            const message = [
                configErrors.length === 1
                    ? 'There was an error with an input.'
                    : `There were ${configErrors.length} errors with inputs.`,
                ...configErrors.map((error) => {
                    if (isMissingData(error)) {
                        return `Input "${error.path.join('-')}" is missing`
                    }

                    if (isInvalidData(error)) {
                        return `Input "${error.path.join('-')}" is invalid: ${error.message}`
                    }

                    throw new Error(`Unexpected error: ${error}`)
                }),
            ].join('\n\n')

            return new Error(message)
        }),
    ),
)

function validateConfig<T extends Record<string, any>>(config: {
    [K in keyof T]: Config.Config<T[K]>
}) {
    const entries = objectEntriesUnsafe(config)

    return Effect.validateAll(entries, (entry) => entry[1]).pipe(
        Effect.map((values) =>
            Object.fromEntries(entries.map((entry, index) => [entry[0], values[index]])),
        ),
    ) as Effect.Effect<T, ConfigError.ConfigError[]>
}
