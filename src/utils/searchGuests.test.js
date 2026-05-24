import { describe, it, expect } from 'vitest'
import { searchGuests } from './searchGuests'

const guests = [
  { id: 1, name: 'Alicia Wong', company: 'NovaTech Solutions', table: 1 },
  { id: 2, name: 'Daniel Lim', company: 'Skyline Analytics', table: 2 },
  { id: 3, name: 'Nurul Aisyah', company: 'GreenBridge Foundation', table: 3 },
  { id: 4, name: 'Jason Tan', company: 'PixelForge Studio', table: 3 },
  { id: 5, name: 'Priya Raman', company: 'Meridian Bank', table: 4 },
  { id: 6, name: 'Omar Hassan', company: 'Meridian Bank', table: 1 },
  { id: 7, name: 'Mei Ling Chen', company: 'BlueWave Logistics', table: 4 },
  { id: 8, name: 'Samuel Ortiz', company: 'BlueWave Logistics', table: 4 },
  { id: 9, name: 'Farah Nabila', company: 'Urban Health Initiative', table: 2 },
  { id: 10, name: 'Ethan Koh', company: 'Urban Health Initiative', table: 1 },
  { id: 11, name: 'Hannah Brooks', company: 'Vertex Consulting Group', table: 3 },
  { id: 12, name: 'Arjun Menon', company: 'Orbit Energy', table: 3 },
  { id: 20, name: 'Marcus Lee', company: 'Atlas Advisory', table: 8 },
  { id: 21, name: 'Siti Mariam', company: 'Kindred Health', table: 5 },
]

describe('searchGuests', () => {
  it('returns the correct guest for an exact name match', () => {
    const results = searchGuests('Alicia Wong', guests)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Alicia Wong')
  })

  it('returns matching guests for a partial name search', () => {
    const results = searchGuests('ali', guests)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((g) => g.name === 'Alicia Wong')).toBe(true)
  })

  it('is case-insensitive', () => {
    const results = searchGuests('DANIEL LIM', guests)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Daniel Lim')
  })

  it('returns matching guests when searching by company name', () => {
    const results = searchGuests('Meridian Bank', guests)
    expect(results).toHaveLength(2)
    expect(results.every((g) => g.company === 'Meridian Bank')).toBe(true)
  })

  it('returns the correct table number for a matched guest', () => {
    const results = searchGuests('Marcus Lee', guests)
    expect(results[0].table).toBe(8)
  })

  it('returns an empty array when the guest does not exist', () => {
    const results = searchGuests('Nonexistent Person', guests)
    expect(results).toEqual([])
  })

  it('returns an empty array when the search input is empty', () => {
    expect(searchGuests('', guests)).toEqual([])
    expect(searchGuests('   ', guests)).toEqual([])
  })

  it('respects the result limit', () => {
    // 'a' matches many guests — limit to 3 to test capping
    const results = searchGuests('a', guests, 3)
    expect(results.length).toBeLessThanOrEqual(3)
  })
})
