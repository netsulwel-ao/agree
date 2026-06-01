import { supabase } from '../lib/supabase';

export const SUPPORTED_CURRENCIES = [
  { code: 'AOA', name: 'Kwanza (AOA)', symbol: 'Kz', locale: 'pt-AO' },
  { code: 'USD', name: 'Dólar (USD)', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€', locale: 'de-DE' },
  { code: 'BRL', name: 'Real (BRL)', symbol: 'R$', locale: 'pt-BR' },
  { code: 'GBP', name: 'Libra (GBP)', symbol: '£', locale: 'en-GB' },
  { code: 'CNY', name: 'Yuan (CNY)', symbol: '¥', locale: 'zh-CN' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

let ratesCache: Record<string, number> | null = null;

export async function getExchangeRates(): Promise<Record<string, number>> {
  if (ratesCache) return ratesCache;
  const { data } = await supabase.from('exchange_rates').select('from_currency, to_currency, rate');
  if (!data) return {};
  const map: Record<string, number> = {};
  for (const r of data) map[`${r.from_currency}->${r.to_currency}`] = Number(r.rate);
  ratesCache = map;
  return map;
}

export function clearRatesCache() { ratesCache = null; }

export async function convertCurrency(
  value: number, from: string, to: string
): Promise<{ value: number; rate: number } | null> {
  if (from === to) return { value, rate: 1 };
  const rates = await getExchangeRates();
  const key = `${from}->${to}`;
  const rate = rates[key];
  if (!rate) return null;
  return { value: value * rate, rate };
}

export function formatCurrency(value: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) return `${value.toLocaleString()} ${currencyCode}`;
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency.symbol} ${value.toLocaleString(currency.locale, { minimumFractionDigits: 2 })}`;
  }
}

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || code;
}

export async function getContractWithConvertedValue(contract: any, targetCurrency: string) {
  const from = contract.currency || 'AOA';
  const value = Number(contract.value) || 0;
  if (from === targetCurrency) return { ...contract, displayValue: formatCurrency(value, from), converted: null };
  const result = await convertCurrency(value, from, targetCurrency);
  return {
    ...contract,
    displayValue: formatCurrency(value, from),
    converted: result ? { value: formatCurrency(result.value, targetCurrency), rate: result.rate, currency: targetCurrency } : null,
  };
}
