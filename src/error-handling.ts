interface ActionErrorParams {
    title: string
    messages?: readonly any[]
    cause?: unknown
}

export class ActionError extends Error {
    readonly title: string
    readonly messages: readonly any[]

    constructor(params: ActionErrorParams) {
        const fullMessage = [params.title, ...(params.messages ?? [])].join('\n    ')

        super(fullMessage, { cause: params.cause })

        this.title = params.title
        this.messages = params.messages ?? []
    }
}
