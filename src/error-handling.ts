export class ExitError extends Error {
    readonly messages: readonly any[]

    constructor(...messages: readonly [string, ...any[]]) {
        super(messages[0])
        this.messages = messages
    }
}

export function isExitError(error: unknown): error is ExitError {
    return error instanceof ExitError
}
