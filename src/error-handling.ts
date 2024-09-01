interface ActionErrorParams {
    title: string
    messages?: readonly any[]
    cause?: unknown
    exit?: 'success' | 'failure'
}

export class ActionError extends Error {
    readonly title: string
    readonly messages: readonly any[]
    readonly exit: 'success' | 'failure'

    constructor(params: ActionErrorParams) {
        const fullMessage = [params.title, ...(params.messages ?? [])].join('\n    ')

        super(fullMessage, { cause: params.cause })

        this.title = params.title
        this.messages = params.messages ?? []
        this.exit = params.exit ?? 'failure'
    }
}

export function transformToActionError(title: string) {
    return (error: unknown) => {
        if (error instanceof Error) {
            return new ActionError({
                title,
                messages: [error.message],
                cause: error,
            })
        }

        return new ActionError({
            title,
            messages: [error],
            cause: error,
        })
    }
}
