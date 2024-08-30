export class ExitError extends Error {
    readonly messages: readonly any[]

    constructor(...messages: readonly [string, ...any[]]) {
        super(messages[0])
        this.messages = messages
    }
}
