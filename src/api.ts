// src/api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import type { SelectedResult, StockResponse } from "./types";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Search companies (uses backend /search)
export async function searchCompanies(q: string, exchange = "Auto", limit = 50, enrich_top = 0): Promise<SelectedResult[]> {
  if (!q || q.trim().length === 0) return [];
  const res = await client.get<{ results: SelectedResult[] }>("/search", {
    params: { q: q.trim(), exchange, limit, enrich_top },
  });
  return res.data.results || [];
}

// Fetch stock by symbol (direct path): /stock?symbol=...
export async function fetchStockBySymbol(symbol: string, opts?: { period?: string; interval?: string; max_points?: number; compact?: boolean; exchange?: string }): Promise<StockResponse> {
  if (!symbol || symbol.trim().length === 0) throw new Error("symbol required");
  const params: any = {
    symbol: symbol.trim(),
    period: opts?.period ?? "1Y",
    interval: opts?.interval ?? "1d",
    max_points: opts?.max_points ?? 0,
    compact: opts?.compact ? "true" : "false",
    exchange: opts?.exchange ?? "Auto",
  };
  const res = await client.get<StockResponse>("/stock", { params });
  return res.data;
}

// Backwards-compatible: search by company name (calls /stock?company=...)
export async function fetchStockByCompany(company: string, exchange = "Auto", opts?: { period?: string; interval?: string; max_points?: number; compact?: boolean }): Promise<StockResponse> {
  const params: any = {
    company,
    exchange,
    period: opts?.period ?? "1Y",
    interval: opts?.interval ?? "1d",
    max_points: opts?.max_points ?? 0,
    compact: opts?.compact ? "true" : "false",
  };
  const res = await client.get<StockResponse>("/stock", { params });
  return res.data;
}
