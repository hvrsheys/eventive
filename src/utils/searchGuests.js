/**
 * Searches a list of guests by name or company name.
 *
 * @param {string} query 
 * @param {Array} guests 
 * @param {number} limit 
 * @returns {Array} 
 */
export function searchGuests(query, guests, limit = 8) {
  if (!query || !query.trim()) return []

  const normalizedQuery = query.trim().toLowerCase()

  return guests
    .filter((guest) => {
      const nameMatch = guest.name.toLowerCase().includes(normalizedQuery)
      const companyMatch = guest.company.toLowerCase().includes(normalizedQuery)
      return nameMatch || companyMatch
    })
    .slice(0, limit)
}
