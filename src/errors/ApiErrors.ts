export class ApiError {
    public readonly message: string
    public readonly statusCode: number

    constructor({
        message,
        statusCode,
    }: {
        message: string
        statusCode: number
    }) {
        this.message = message
        this.statusCode = statusCode
    }
}

export class DataInsufficientError extends ApiError {
    constructor({ message }: { message: string }) {
        super({ message, statusCode: 422 })
    }
}

export class DataAlreadyExistsError extends ApiError {
    constructor({ message }: { message: string }) {
        super({ message, statusCode: 409 })
    }
}

export class DataNotMatchError extends ApiError {
    constructor({ message }: { message: string }) {
        super({ message, statusCode: 401 })
    }
}

export class NotFoundError extends ApiError {
    constructor({ message }: { message: string }) {
        super({ message, statusCode: 404 })
    }
}
