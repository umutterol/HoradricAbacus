// Complete list of Diablo 4 runes (48 total)
export const RUNE_NAMES = [
  // Ritual Runes (8)
  'Ahu', 'Bac', 'Igni', 'Lith', 'Nagu', 'Tam', 'Xol', 'Yul',
  // Offering Runes (4)
  'Feo', 'Neo', 'Noc', 'Poc',
  // Invocation Runes (5)
  'Cem', 'Cir', 'Moni', 'Yax', 'Zan',
  // Greater Invocation Runes (6)
  'Eom', 'Jah', 'Ohm', 'Vex', 'Xan', 'Yom',
  // Essence Runes (11)
  'Chac', 'Kel', 'Kry', 'Lac', 'Mot', 'Ner', 'Qax', 'Que', 'Thul', 'Tzic', 'Wat', 'Xal', 'Zec',
  // Greater Essence Runes (10)
  'Ceh', 'Gar', 'Lum', 'Qua', 'Tal', 'Teb', 'Tec', 'Ton', 'Tun', 'Zid'
] as const;

export type RuneName = typeof RUNE_NAMES[number];

// Check if a string contains a valid rune name
export function extractRuneName(text: string): RuneName | null {
  const lowerText = text.toLowerCase();
  for (const rune of RUNE_NAMES) {
    if (lowerText.includes(rune.toLowerCase())) {
      return rune;
    }
  }
  return null;
}

// Check if item is a rune listing
export function isRuneListing(itemName: string): boolean {
  return extractRuneName(itemName) !== null;
}

// Parse price string to number (handles K, M, B suffixes)
export function parsePrice(priceValue: unknown): number {
  if (typeof priceValue === 'number') return priceValue;
  if (typeof priceValue === 'string') {
    const match = priceValue.match(/(\d+(?:[.,]\d+)?)\s*([KMB])?/i);
    if (match) {
      let value = parseFloat(match[1].replace(/,/g, ''));
      const suffix = match[2]?.toUpperCase();
      if (suffix === 'K') value *= 1000;
      else if (suffix === 'M') value *= 1000000;
      else if (suffix === 'B') value *= 1000000000;
      return Math.round(value);
    }
  }
  return 0;
}

// Format price for display
export function formatPrice(price: number): string {
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
  return price.toString();
}
