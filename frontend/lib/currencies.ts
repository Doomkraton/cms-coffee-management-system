export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolAfter: boolean; // true → "18 Kč", false → "$18"
}

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar",          symbol: "$",   symbolAfter: false },
  { code: "EUR", name: "Euro",               symbol: "€",   symbolAfter: false },
  { code: "GBP", name: "British Pound",      symbol: "£",   symbolAfter: false },
  { code: "CZK", name: "Czech Koruna",       symbol: "Kč",  symbolAfter: true  },
  { code: "PLN", name: "Polish Zloty",       symbol: "zł",  symbolAfter: true  },
  { code: "CHF", name: "Swiss Franc",        symbol: "CHF", symbolAfter: false },
  { code: "SEK", name: "Swedish Krona",      symbol: "kr",  symbolAfter: true  },
  { code: "NOK", name: "Norwegian Krone",    symbol: "kr",  symbolAfter: true  },
  { code: "DKK", name: "Danish Krone",       symbol: "kr",  symbolAfter: true  },
  { code: "HUF", name: "Hungarian Forint",   symbol: "Ft",  symbolAfter: true  },
  { code: "RON", name: "Romanian Leu",       symbol: "lei", symbolAfter: true  },
  { code: "BGN", name: "Bulgarian Lev",      symbol: "лв",  symbolAfter: true  },
  { code: "JPY", name: "Japanese Yen",       symbol: "¥",   symbolAfter: false },
  { code: "AUD", name: "Australian Dollar",  symbol: "A$",  symbolAfter: false },
  { code: "CAD", name: "Canadian Dollar",    symbol: "C$",  symbolAfter: false },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/**
 * Format a monetary amount for display.
 * e.g. formatCost(1.33, "USD") → "$1.33"
 *      formatCost(32, "CZK")   → "32.00 Kč"
 */
export function formatCost(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  const value = amount.toFixed(2);
  return currency.symbolAfter
    ? `${value} ${currency.symbol}`
    : `${currency.symbol}${value}`;
}

/**
 * Calculate cost per brew.
 * Requires both purchase_cost AND quantity_purchased_grams to be set.
 * quantity_purchased_grams is the original package size — it never changes.
 * We deliberately do NOT fall back to quantity_grams because that field
 * decreases with every brew, which would silently inflate cost-per-gram.
 */
export function calcBrewCost(
  coffeeAmountG: number | null | undefined,
  purchaseCost: number | null | undefined,
  quantityPurchasedG: number | null | undefined,
): number | null {
  if (!coffeeAmountG || !purchaseCost || !quantityPurchasedG || quantityPurchasedG <= 0) {
    return null;
  }
  return coffeeAmountG * (purchaseCost / quantityPurchasedG);
}
