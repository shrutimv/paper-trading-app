# logic.py
from urllib.parse import quote
import requests
import yfinance as yf
import pandas as pd
from cachetools import TTLCache, cached
import math
from typing import List, Dict, Tuple, Any

# cache for search/info/history
cache = TTLCache(maxsize=512, ttl=300)  # 5 minutes by default


def _normalize_item(item: dict) -> dict:
    """Normalize raw Yahoo search item into consistent shape."""
    return {
        "symbol": item.get("symbol"),
        "shortname": item.get("shortname") or item.get("longname") or item.get("name"),
        "exchange": item.get("exchange"),
        "quoteType": item.get("quoteType"),
    }


@cached(cache)
def yahoo_search(name: str) -> List[dict]:
    """
    Query Yahoo Finance search endpoint and return normalized results.
    This is cached to avoid repeated external calls.
    """
    if not name:
        return []
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={quote(name)}"
    headers = {"User-Agent": "Mozilla/5.0 (compatible)"}
    try:
        r = requests.get(url, headers=headers, timeout=10)
        j = r.json()
        results = j.get("quotes", [])  # primary field
    except Exception:
        results = []
    out = []
    for item in results:
        if not isinstance(item, dict):
            continue
        if "symbol" not in item:
            continue
        out.append(_normalize_item(item))
    return out


def pick_best_symbol(results: List[dict], company_name: str, preferred: str = "Auto") -> dict:
    """
    Choose the best matching result from search results. Tries exact shortname/symbol,
    then preferred exchange matches, then equity/ETF preference, then first.
    """
    if not results:
        return None
    pref = (preferred or "Auto").upper()
    # exact match shortname or symbol
    for r in results:
        if r.get("shortname") and company_name.lower() == r["shortname"].lower():
            return r
        if r.get("symbol") and company_name.lower() == r["symbol"].lower():
            return r
    # prefer exchange matches
    if pref in ("NSE", "BSE"):
        for r in results:
            exch = (r.get("exchange") or "").upper()
            if pref == "NSE" and ("NS" in exch or "NSE" in exch):
                return r
            if pref == "BSE" and ("BO" in exch or "BSE" in exch or "BOM" in exch):
                return r
        # fallback check symbol suffix .NS or .BO
        for r in results:
            sym = (r.get("symbol") or "").upper()
            if pref == "NSE" and sym.endswith(".NS"):
                return r
            if pref == "BSE" and sym.endswith(".BO"):
                return r
    # prefer equities and ETFs
    for r in results:
        if r.get("quoteType") in ("EQUITY", "ETF", "MUTUALFUND"):
            return r
    return results[0]


@cached(cache)
def fetch_yf_info_and_history(yf_symbol: str, period: str = "5Y", interval: str = "1d") -> Tuple[dict, List[dict]]:
    """
    Fetch yfinance Ticker info and history for a symbol.
    Returns (info_dict, history_list).
    This function is cached.
    """
    ticker = yf.Ticker(yf_symbol)
    try:
        info = ticker.info or {}
    except Exception:
        info = {}
    try:
        hist = ticker.history(period=period, interval=interval, actions=False)
    except Exception:
        hist = pd.DataFrame()
    history_list: List[dict] = []
    if not hist.empty:
        # drop rows with NaN Close (incomplete rows)
        hist = hist.dropna(subset=["Close"])
        for idx, row in hist.iterrows():
            date_str = pd.to_datetime(idx).strftime("%Y-%m-%d")
            history_list.append({
                "date": date_str,
                "open": None if pd.isna(row.get("Open")) else float(row["Open"]),
                "high": None if pd.isna(row.get("High")) else float(row["High"]),
                "low": None if pd.isna(row.get("Low")) else float(row["Low"]),
                "close": None if pd.isna(row.get("Close")) else float(row["Close"]),
                "volume": None if pd.isna(row.get("Volume")) else int(row["Volume"]),
            })
    return info, history_list


def _downsample_history(history: List[dict], max_points: int) -> List[dict]:
    """
    Downsample history evenly to at most max_points.
    """
    if not history or max_points <= 0 or len(history) <= max_points:
        return history
    n = len(history)
    step = n / max_points
    result = []
    i = 0.0
    while int(round(i)) < n and len(result) < max_points:
        idx = int(round(i))
        result.append(history[idx])
        i += step
    return result


def get_stock_history(yf_symbol: str, period: str = "5Y", interval: str = "1d", max_points: int = 0, compact: bool = False) -> List[dict]:
    """
    Fetch history and optionally downsample/compact it.
    Returns a list of dicts (oldest -> newest).
    """
    _, history = fetch_yf_info_and_history(yf_symbol, period=period, interval=interval)
    if max_points and max_points > 0:
        history = _downsample_history(history, max_points)
    if compact:
        return [{"date": h["date"], "close": h["close"]} for h in history]
    return history


def get_stock_data_by_symbol(yf_symbol: str, period: str = "5Y", interval: str = "1d", max_points: int = 0, compact: bool = False) -> dict:
    """
    Direct lookup by Yahoo symbol (e.g. 'TCS.NS' or '532540.BO').
    Returns dict: { selected, meta, history } same shape as get_stock_data.
    """
    if not yf_symbol or not str(yf_symbol).strip():
        return {"error": "symbol_required"}
    yf_symbol = yf_symbol.strip()
    try:
        info, _ = fetch_yf_info_and_history(yf_symbol, period=period, interval=interval)
    except Exception as e:
        return {"error": "yf_error", "detail": str(e)}

    selected = {
        "symbol": yf_symbol,
        "shortname": info.get("shortName") or info.get("longName"),
        "exchange": info.get("exchange") or None,
        "quoteType": info.get("quoteType") or None,
    }

    meta = {
        "symbol": yf_symbol,
        "resolved_name": info.get("longName") or info.get("shortName") or selected.get("shortname"),
        "currency": info.get("currency"),
        "regularMarketPrice": info.get("regularMarketPrice") or info.get("previousClose"),
        "previousClose": info.get("previousClose"),
        "marketCap": info.get("marketCap"),
        "trailingPE": info.get("trailingPE"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
    }

    history = get_stock_history(yf_symbol, period=period, interval=interval, max_points=max_points, compact=compact)

    return {
        "selected": selected,
        "meta": meta,
        "history": history,
    }


def get_stock_data(company_name: str, preferred_exchange: str = "Auto", period: str = "5Y", interval: str = "1d", max_points: int = 0, compact: bool = False) -> dict:
    """
    Original company-name flow: search -> pick best symbol -> fetch info/history -> return shape.
    """
    if not company_name or not company_name.strip():
        return {"error": "company_name is required"}
    company_name = company_name.strip()
    results = yahoo_search(company_name)
    selected = pick_best_symbol(results, company_name, preferred_exchange)
    if not selected:
        return {"error": "symbol_not_found", "search_results": results}
    yf_symbol = selected["symbol"]
    info, _ = fetch_yf_info_and_history(yf_symbol, period=period, interval=interval)
    meta = {
        "symbol": yf_symbol,
        "resolved_name": info.get("longName") or info.get("shortName") or selected.get("shortname"),
        "currency": info.get("currency"),
        "regularMarketPrice": info.get("regularMarketPrice") or info.get("previousClose"),
        "previousClose": info.get("previousClose"),
        "marketCap": info.get("marketCap"),
        "trailingPE": info.get("trailingPE"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
    }
    history = get_stock_history(yf_symbol, period=period, interval=interval, max_points=max_points, compact=compact)
    return {
        "selected": selected,
        "meta": meta,
        "history": history
    }
