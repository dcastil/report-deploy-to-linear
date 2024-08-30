import core from '@actions/core'
import { ConfigError, ConfigProvider, ConfigProviderPathPatch, Effect, Layer, pipe } from 'effect'

const pathDelimiter = '-'
const sequenceDelimiterRegex = /\s*,\s*/

const githubActionConfigProvider = ConfigProvider.fromFlat(
    ConfigProvider.makeFlat({
        load(path, primitive, split) {
            const pathString = path.join(pathDelimiter)
            const inputValue = core.getInput(pathString)

            if (!inputValue) {
                return Effect.fail(
                    ConfigError.MissingData(
                        path as string[],
                        'Expected input parameter is missing',
                        { pathDelim: pathDelimiter },
                    ),
                )
            }

            if (split) {
                return pipe(
                    inputValue.split(sequenceDelimiterRegex),
                    Effect.forEach(primitive.parse),
                    Effect.mapError(ConfigError.prefixed(path as string[])),
                )
            }

            return pipe(
                primitive.parse(inputValue),
                Effect.mapBoth({
                    onSuccess: Array.of,
                    onFailure: ConfigError.prefixed(path as string[]),
                }),
            )
        },
        enumerateChildren(path) {
            return Effect.fail(
                ConfigError.Unsupported(
                    path as string[],
                    'Enumerating input children is not supported in GitHub Actions',
                    { pathDelim: pathDelimiter },
                ),
            )
        },
        patch: ConfigProviderPathPatch.empty,
    }),
)

export const ConfigProviderLive = Layer.setConfigProvider(githubActionConfigProvider)

export function getConfigProviderTest(json: object) {
    return Layer.setConfigProvider(ConfigProvider.fromJson(json))
}
