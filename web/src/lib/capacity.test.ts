import { describe, expect, it } from 'vitest'
import type { CapacityPage, PersonCapacity } from '../api/capacity'
import {
  cellLabel,
  describeOverage,
  formatHours,
  loadPercent,
  overageBadge,
  patchPersonInPages,
  rowOverage,
  teamLoadPercent,
} from './capacity'

const person = (id: number, weeklyHours: number, allocated: number[]): PersonCapacity => ({
  id,
  name: `Person ${id}`,
  weeklyHours,
  allocated,
})

describe('rowOverage', () => {
  it('adds up only the weeks over capacity', () => {
    expect(rowOverage(person(1, 20, [30, 10, 28]))).toEqual({ weeks: 2, hours: 18 })
  })

  it('treats any allocation as over when capacity is zero', () => {
    expect(rowOverage(person(5, 0, [0, 20, 0]))).toEqual({ weeks: 1, hours: 20 })
  })
})

describe('describeOverage', () => {
  it('says nothing when there is no overage', () => {
    expect(describeOverage({ weeks: 0, hours: 0 })).toBeNull()
  })

  it('uses singular and plural weeks', () => {
    expect(describeOverage({ weeks: 1, hours: 5 })).toBe('Over by 5h in 1 week')
    expect(describeOverage({ weeks: 2, hours: 18 })).toBe('Over by 18h in 2 weeks')
  })
})

describe('patchPersonInPages', () => {
  const pages: CapacityPage[] = [
    { weeks: ['2026-01-05'], people: [person(1, 40, [40]), person(2, 40, [0])] },
    { weeks: ['2026-01-05'], people: [person(3, 20, [10])] },
  ]

  it('changes only the matching person and keeps everything else as the same object', () => {
    const data = { pages, pageParams: [undefined, 'next'] }
    const patched = patchPersonInPages(data, 2, 32)

    expect(patched.pages[0].people[1].weeklyHours).toBe(32)
    expect(patched.pages[0].people[0]).toBe(pages[0].people[0])
    expect(patched.pages[1]).toBe(pages[1])
    expect(patched.pageParams).toBe(data.pageParams)
  })
})

describe('teamLoadPercent', () => {
  it('rounds allocated against capacity', () => {
    expect(teamLoadPercent(11225, 52149)).toBe(22)
  })

  it('has no percentage when there is no capacity', () => {
    expect(teamLoadPercent(0, 0)).toBeNull()
  })
})

describe('formatHours', () => {
  it('keeps whole hours and rounds fractions to one decimal', () => {
    expect(formatHours(40)).toBe('40')
    expect(formatHours(12.5)).toBe('12.5')
    expect(formatHours(7.125)).toBe('7.1')
  })
})

describe('loadPercent', () => {
  it('fills the bar up to 100% and no further', () => {
    expect(loadPercent(30, 40)).toBe(75)
    expect(loadPercent(45, 40)).toBe(100)
  })

  it('handles zero capacity', () => {
    expect(loadPercent(20, 0)).toBe(100)
    expect(loadPercent(0, 0)).toBe(0)
  })
})

describe('overageBadge', () => {
  it('shows the extra hours, or names the zero-capacity case', () => {
    expect(overageBadge(45, 40)).toBe('+5h')
    expect(overageBadge(20, 0)).toBe('No capacity')
  })
})

describe('cellLabel', () => {
  it('reads as a sentence for tooltips and screen readers', () => {
    expect(cellLabel('Dee Okafor', '2026-01-05', 45, 40)).toBe(
      'Dee Okafor, week of Jan 5: 45h allocated of 40h (over by 5h)',
    )
    expect(cellLabel('Ana Ferreira', '2025-12-29', 30, 40)).toBe('Ana Ferreira, week of Dec 29: 30h allocated of 40h')
  })
})
