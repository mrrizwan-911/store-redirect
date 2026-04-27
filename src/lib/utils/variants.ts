/**
 * Generates the Cartesian product of all provided option values.
 *
 * Example Input:
 * [
 *   { name: "Color", values: ["Red", "Blue"] },
 *   { name: "Size", values: ["S", "M"] }
 * ]
 *
 * Example Output:
 * [
 *   { "Color": "Red", "Size": "S" },
 *   { "Color": "Red", "Size": "M" },
 *   { "Color": "Blue", "Size": "S" },
 *   { "Color": "Blue", "Size": "M" }
 * ]
 */
export function generateCombinations(
  options: { name: string; values: string[] }[]
): Record<string, string>[] {
  if (!options || options.length === 0) return []

  // Filter out options that have no values
  const validOptions = options.filter(opt => opt.values && opt.values.length > 0)
  if (validOptions.length === 0) return []

  return validOptions.reduce((acc, option) => {
    // For the first option, initialize the accumulator
    if (acc.length === 0) {
      return option.values.map(val => ({ [option.name]: val }))
    }

    // For subsequent options, multiply the combinations
    const combinations: Record<string, string>[] = []
    for (const existing of acc) {
      for (const val of option.values) {
        combinations.push({ ...existing, [option.name]: val })
      }
    }
    return combinations
  }, [] as Record<string, string>[])
}

/**
 * Helper to generate an acronym from a given string.
 * - Extracts the first letter of each word if there are multiple words (e.g. "Winter Leather Jacket" -> "WLJ").
 * - If single word <= 3 chars, keeps it uppercase (e.g. "XL" -> "XL").
 * - If single word > 3 chars, takes first 3 chars uppercase (e.g. "Large" -> "LAR").
 */
function getAcronym(str: string): string {
  const parts = str.split(/[\s-]+/).filter(Boolean)

  if (parts.length > 1) {
    return parts.map(p => p[0].toUpperCase()).join('')
  }

  const word = str.trim().toUpperCase()
  return word.length <= 3 ? word : word.substring(0, 3)
}

/**
 * Generates an auto-SKU based on the base product title and selected option values.
 *
 * Example Input:
 * Title: "Winter Leather Jacket"
 * Options: { "Color": "Midnight Black", "Size": "XL" }
 *
 * Example Output:
 * "WLJ-MB-XL"
 */
export function generateVariantSKU(
  productTitle: string,
  optionValues: Record<string, string>
): string {
  if (!productTitle) return ''

  const baseSku = getAcronym(productTitle)
  const parts = [baseSku]

  // Add the acronyms of each option value
  // Ensure consistent ordering (e.g., sort keys) so the SKU is deterministic
  const sortedKeys = Object.keys(optionValues).sort()
  for (const key of sortedKeys) {
    const val = optionValues[key]
    if (val) {
      parts.push(getAcronym(val))
    }
  }

  return parts.join('-')
}
