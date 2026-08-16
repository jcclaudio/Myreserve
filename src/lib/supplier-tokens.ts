/**
 * 🎨 FIXTUR — IDENTIDADE VISUAL & DESIGN TOKENS DE FORNECEDORES
 */

export interface SupplierTheme {
  name: string;
  badgeClass: string;
  borderClass: string;
  accentColor: string;
  dotColor: string;
}

export const SUPPLIER_TOKENS: Record<string, SupplierTheme> = {
  booking: {
    name: "Booking.com",
    badgeClass: "bg-blue-50 text-blue-900 border-blue-300/80 font-bold",
    borderClass: "border-blue-400",
    accentColor: "#003580",
    dotColor: "bg-blue-600",
  },
  bestbuy: {
    name: "BestBuy Travel",
    badgeClass: "bg-orange-50 text-orange-950 border-orange-300/80 font-bold",
    borderClass: "border-orange-400",
    accentColor: "#FF6B00",
    dotColor: "bg-orange-600",
  },
  interep: {
    name: "Interep",
    badgeClass: "bg-emerald-50 text-emerald-950 border-emerald-300/80 font-bold",
    borderClass: "border-emerald-500",
    accentColor: "#2D5A27",
    dotColor: "bg-emerald-700",
  },
  default: {
    name: "Fornecedor",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200 font-semibold",
    borderClass: "border-slate-300",
    accentColor: "#475569",
    dotColor: "bg-slate-500",
  },
};

export function getSupplierTheme(canalNome: string): SupplierTheme {
  if (!canalNome) return SUPPLIER_TOKENS.default;
  const clean = canalNome.toLowerCase().trim();

  if (clean.includes("booking")) return SUPPLIER_TOKENS.booking;
  if (clean.includes("best") || clean.includes("bestbuy")) return SUPPLIER_TOKENS.bestbuy;
  if (clean.includes("interep")) return SUPPLIER_TOKENS.interep;

  return SUPPLIER_TOKENS.default;
}
