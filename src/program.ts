import { Effect, Layer } from 'effect'
import { ActionError } from './error-handling'
import { pRsMergedSincePreviousDeploy } from './prs-merged-since-previous-deploy'
import { reportDeployedPrsToLinear } from './report-deployed-prs-to-linear'
import { GithubClient } from './services/github-client'
import { Inputs, InputsLive } from './services/inputs'
import { LinearClient } from './services/linear-client'
import { LoggerLive } from './services/logger'

interface CreateProgramParams {
    configProvider: Layer.Layer<never>
    githubClient: Layer.Layer<GithubClient, never, Inputs>
    linearClient: Layer.Layer<LinearClient, never, Inputs>
}

export function createProgram(params: CreateProgramParams): Effect.Effect<void, ActionError> {
    return Effect.void.pipe(
        Effect.andThen(() => pRsMergedSincePreviousDeploy),
        Effect.andThen(reportDeployedPrsToLinear),
        Effect.provide(params.linearClient),
        Effect.provide(params.githubClient),
        Effect.provide(InputsLive),
        Effect.catchIf(
            (error) => error.exit === 'success',
            (error) => Effect.logInfo(error.title, ...error.messages),
        ),
        Effect.tapBoth({
            onSuccess: () => Effect.logInfo('Action completed successfully'),
            onFailure: (error: ActionError) =>
                Effect.logError(error.title, ...error.messages).pipe(
                    Effect.andThen(Effect.logInfo('Action aborted')),
                ),
        }),
        Effect.tapDefect((defect) => Effect.logError('Action died unexpectedly', defect)),
        Effect.provide(LoggerLive),
        Effect.provide(params.configProvider),
    )
}
