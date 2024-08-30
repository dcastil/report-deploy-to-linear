interface ExitErrorParams {
    title: string
    messages?: readonly any[]
}

export class ExitError extends Error {
    readonly title: string
    readonly messages: readonly any[]

    constructor(params: ExitErrorParams) {
        super(params.title)
        this.title = params.title
        this.messages = params.messages ?? []
    }
}
