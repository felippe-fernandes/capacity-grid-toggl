import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, parseFilters, serializeFilters } from './filters'

describe('filters in the url', () => {
  it('reads q and over', () => {
    expect(parseFilters(new URLSearchParams('?q=dee&over=1'))).toEqual({ q: 'dee', overOnly: true })
  })

  it('treats anything other than over=1 as off', () => {
    expect(parseFilters(new URLSearchParams('?over=yes'))).toEqual({ q: '', overOnly: false })
  })

  it('leaves empty filters out of the url', () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toEqual({ q: '', over: '' })
  })
})
