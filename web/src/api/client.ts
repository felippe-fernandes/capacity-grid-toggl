import { z } from 'zod'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly body: unknown

  constructor(status: number, code: string, message: string, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.body = body
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Couldn't reach the server")
    this.name = 'NetworkError'
  }
}

const errorBodySchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
})

export async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch (error) {
    if (init?.signal?.aborted) throw error
    throw new NetworkError()
  }

  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const parsed = errorBodySchema.safeParse(body)
    throw parsed.success
      ? new ApiError(res.status, parsed.data.error.code, parsed.data.error.message, body)
      : new ApiError(res.status, 'unknown', `Request failed (${res.status})`, body)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    console.error(parsed.error)
    throw new ApiError(res.status, 'invalid_response', 'Unexpected response from the server', body)
  }
  return parsed.data
}
