// src/types.ts
export interface SelectedResult {
  symbol: string;
  shortname?: string;
  exchange?: string;
  quoteType?: string;
}

export interface Meta {
  symbol: string;
  resolved_name?: string;
  currency?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  marketCap?: number;
  trailingPE?: number;
  sector?: string;
  industry?: string;
}

export interface HistoryPoint {
  date: string; // YYYY-MM-DD
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
}

export interface StockResponse {
  selected: SelectedResult;
  meta: Meta;
  history: HistoryPoint[];
}
