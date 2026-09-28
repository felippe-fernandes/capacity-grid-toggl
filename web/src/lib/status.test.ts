import { describe, expect, it } from 'vitest'
import { status } from './status'

describe('status', () => {
  it('is over when allocated goes past capacity', () => {
    expect(status(45, 40)).toBe('over')
  })

  it('is over when someone with no capacity has any allocation', () => {
    expect(status(20, 0)).toBe('over')
  })

  it('is full when allocated matches capacity exactly', () => {
    expect(status(40, 40)).toBe('full')
  })

  it('is free when nothing is allocated, even with no capacity', () => {
    expect(status(0, 40)).toBe('free')
    expect(status(0, 0)).toBe('free')
  })

  it('is ok when there is room left', () => {
    expect(status(30, 40)).toBe('ok')
  })
})
