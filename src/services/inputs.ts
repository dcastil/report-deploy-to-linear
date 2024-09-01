import { Config, ConfigError, Context, Effect, Layer, LogLevel, Redacted } from 'effect'
import { isInvalidData, isMissingData } from 'effect/ConfigError'
import { ActionError } from '../error-handling'
import { objectEntriesUnsafe } from '../utils'

export class Inputs extends Context.Tag('Inputs')<Inputs, Effect.Effect.Success<typeof inputs>>() {}

const inputs = validateConfig({
    githubToken: Config.redacted('github-token'),

    linearToken: Config.redacted('linear-token').pipe(
        Config.mapAttempt((linearToken) => {
            if (Redacted.value(linearToken).startsWith('lin_api_')) {
                return {
                    type: 'personal-api-key' as const,
                    token: linearToken,
                }
            }

            if (Redacted.value(linearToken).startsWith('lin_oauth_')) {
                return {
                    type: 'oauth-access-token' as const,
                    token: linearToken,
                }
            }

            throw new Error('Could not parse Linear token.')
        }),
    ),

    deployedCommitSha: Config.string('deployed-commit-sha'),

    workflowRepository: Config.string('workflow-repository').pipe(
        Config.mapAttempt((ownerAndRepo) => {
            const match = /^([^/]+)\/([^/]+)$/.exec(ownerAndRepo)

            if (!match) {
                throw new Error(`Could not parse owner and repo, received "${ownerAndRepo}"`)
            }

            return {
                owner: match[1]!,
                repo: match[2]!,
            }
        }),
    ),

    workflowFileName: Config.string('workflow-file-name').pipe(
        Config.mapAttempt((value) => {
            const match = /^.*?([^/]+\.ya?ml)(@.+)?$/.exec(value)

            if (!match) {
                throw new Error(`Could not parse file name, received "${value}"`)
            }

            return match[1]!
        }),
    ),

    workflowJobName: Config.string('workflow-job-name'),

    isDryRun: Config.boolean('dry-run'),

    logLevel: getLogLevelConfig({ shouldNotLogError: true }),
}).pipe(
    Effect.tap((inputs) => Effect.logDebug('Inputs', inputs)),
    Effect.mapError(
        (configErrors) =>
            new ActionError({
                title:
                    configErrors.length === 1
                        ? 'There was an error with an input'
                        : `There were ${configErrors.length} errors with inputs`,
                messages: configErrors.map(getConfigErrorMessage),
            }),
    ),
)

export const InputsLive = Layer.effect(Inputs, inputs)

export function getLogLevelConfig(
    options?: Parameters<typeof recoverFromConfigErrorWithDefault>[1],
) {
    return Config.logLevel('log-level').pipe(
        recoverFromConfigErrorWithDefault(LogLevel.Info, options),
    )
}

function validateConfig<T extends Record<string, any>>(config: {
    [K in keyof T]: Effect.Effect<T[K], ConfigError.ConfigError>
}) {
    const entries = objectEntriesUnsafe(config)

    return Effect.validateAll(entries, (entry) => entry[1]).pipe(
        Effect.map((values) =>
            Object.fromEntries(entries.map((entry, index) => [entry[0], values[index]])),
        ),
    ) as Effect.Effect<T, ConfigError.ConfigError[]>
}

function getConfigErrorMessage(error: ConfigError.ConfigError) {
    if (isMissingData(error)) {
        return `Input "${error.path.join('-')}" is missing`
    }

    if (isInvalidData(error)) {
        return `Input "${error.path.join('-')}" is invalid: ${error.message}`
    }

    throw new Error(`Unexpected error: ${error}`)
}

function recoverFromConfigErrorWithDefault<A extends string | boolean | number | LogLevel.LogLevel>(
    defaultValue: NoInfer<A>,
    options: { shouldNotLogError?: boolean } = {},
): (self: Effect.Effect<A, ConfigError.ConfigError>) => Effect.Effect<A, never> {
    return Effect.catchAll((configError) => {
        if (!isMissingData(configError) && !isInvalidData(configError)) {
            throw new Error(`Unexpected error: ${configError}`)
        }

        if (options.shouldNotLogError) {
            return Effect.succeed(defaultValue)
        }

        const inputPath = configError.path.join('-')
        const stringifiedDefaultValue =
            typeof defaultValue === 'string' ||
            typeof defaultValue === 'boolean' ||
            typeof defaultValue === 'number'
                ? JSON.stringify(defaultValue)
                : JSON.stringify(defaultValue.label.toLowerCase())

        return Effect.logError(
            `There was a recoverable error with the ${inputPath} input`,
            getConfigErrorMessage(configError),
            `Using ${inputPath} ${stringifiedDefaultValue} instead`,
        ).pipe(Effect.map(() => defaultValue))
    })
}
