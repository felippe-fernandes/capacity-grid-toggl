import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError, NetworkError, request } from './client'

const schema = z.object({ ok: z.boolean() })
const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('request', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('returns the body when it matches the schema', async () => {
    fetchMock.mockResolvedValue(json({ ok: true }))
    await expect(request('/x', schema)).resolves.toEqual({ ok: true })
  })

  it('turns an error body into an ApiError with its code', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'conflict', message: 'changed' } }, 409))
    await expect(request('/x', schema)).rejects.toMatchObject({ status: 409, code: 'conflict', message: 'changed' })
  })

  it('still throws an ApiError when the error body is not ours', async () => {
    fetchMock.mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 }))
    await expect(request('/x', schema)).rejects.toMatchObject({ status: 502, code: 'unknown' })
  })

  it('rejects a response that does not match the schema', async () => {
    fetchMock.mockResolvedValue(json({ ok: 'yes' }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(request('/x', schema)).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('reports a network failure as NetworkError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(request('/x', schema)).rejects.toBeInstanceOf(NetworkError)
  })

  it('lets an abort through untouched', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    const result = request('/x', schema, { signal: controller.signal })
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    await expect(result).rejects.not.toBeInstanceOf(ApiError)
  })
})
