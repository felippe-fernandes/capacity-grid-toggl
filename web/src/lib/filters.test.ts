import { describe, expect, it } from 'vitest'
import type { PersonCapacity } from '../api/capacity'
import { DEFAULT_FILTERS, filterPeople, parseFilters, serializeFilters } from './filters'

const people: PersonCapacity[] = [
  { id: 1, name: 'Ana Ferreira', weeklyHours: 40, allocated: [40, 0, 30] },
  { id: 4, name: 'Dee Okafor', weeklyHours: 40, allocated: [0, 45, 40] },
  { id: 5, name: 'Eli Nakamura', weeklyHours: 0, allocated: [0, 20, 0] },
]

const names = (list: PersonCapacity[]) => list.map((p) => p.name)

describe('filterPeople', () => {
  it('returns everyone with no filters', () => {
    expect(names(filterPeople(people, DEFAULT_FILTERS))).toEqual(['Ana Ferreira', 'Dee Okafor', 'Eli Nakamura'])
  })

  it('matches names ignoring case', () => {
    expect(names(filterPeople(people, { q: 'OKA', overOnly: false }))).toEqual(['Dee Okafor'])
  })

  it('keeps only people over capacity in at least one week', () => {
    expect(names(filterPeople(people, { q: '', overOnly: true }))).toEqual(['Dee Okafor', 'Eli Nakamura'])
  })

  it('combines both filters', () => {
    expect(names(filterPeople(people, { q: 'eli', overOnly: true }))).toEqual(['Eli Nakamura'])
  })
})

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
