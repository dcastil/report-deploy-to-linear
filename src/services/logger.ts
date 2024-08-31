import { Effect, Layer, Logger } from 'effect'
import { getLogLevelConfig } from './inputs'

export const LoggerLive = getLogLevelConfig().pipe(
    Effect.andThen(Logger.minimumLogLevel),
    Layer.unwrapEffect,
    Layer.provide(Logger.pretty),
)
