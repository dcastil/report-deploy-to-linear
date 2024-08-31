interface FatalErrorParams {
    title: string
    messages?: readonly any[]
}

export class FatalError extends Error {
    readonly title: string
    readonly messages: readonly any[]

    constructor(params: FatalErrorParams) {
        super([params.title, ...(params.messages ?? [])].join('\n    '))
        this.title = params.title
        this.messages = params.messages ?? []
    }
}
