# logic.py
from urllib.parse import quote
import requests
import pandas as pd
from cachetools import TTLCache, cached
from typing import List, Dict, Tuple, Any
from datetime import datetime, timezone, timedelta

# Cache for search & chart responses
cache = TTLCache(maxsize=1024, ttl=120)  # 2 minutes cache

# Known symbol migrations / demergers on NSE/BSE
SYMBOL_ALIASES = {
    "TATAMOTORS.NS": "TMCV.NS",
    "TATAMOTORS.BO": "TMCV.BO",
    "TATAMOTORS": "TMCV.NS",
    "TATAMTRDVR.NS": "TMCV.NS",
    "TATAMTRDVR.BO": "TMCV.BO",
}


def check_indian_market_status() -> dict:
    """Returns whether the Indian Stock Market (NSE/BSE) is currently in session."""
    ist = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(ist)
    is_weekday = now.weekday() < 5  # Mon (0) to Fri (4)
    market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    is_open = is_weekday and (market_open <= now <= market_close)
    return {
        "isMarketOpen": is_open,
        "marketState": "OPEN" if is_open else "CLOSED",
        "marketHours": "09:15 - 15:30 IST",
        "currentTimeIST": now.strftime("%Y-%m-%d %H:%M:%S"),
        "statusMessage": "🟢 Live Market (09:15 - 15:30 IST)" if is_open else "🔴 Market Closed • Showing data up to 3:30 PM IST",
    }


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
    """Query Yahoo Finance search endpoint and return normalized results."""
    if not name:
        return []
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={quote(name)}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        r = requests.get(url, headers=headers, timeout=8)
        j = r.json()
        results = j.get("quotes", [])
    except Exception:
        results = []
    out = []
    for item in results:
        if not isinstance(item, dict) or "symbol" not in item:
            continue
        out.append(_normalize_item(item))
    return out


def pick_best_symbol(results: List[dict], company_name: str, preferred: str = "Auto") -> dict:
    """Choose best matching symbol from search results."""
    if not results:
        return None
    pref = (preferred or "Auto").upper()
    for r in results:
        if r.get("shortname") and company_name.lower() == r["shortname"].lower():
            return r
        if r.get("symbol") and company_name.lower() == r["symbol"].lower():
            return r
    if pref in ("NSE", "BSE"):
        for r in results:
            exch = (r.get("exchange") or "").upper()
            if pref == "NSE" and ("NS" in exch or "NSE" in exch):
                return r
            if pref == "BSE" and ("BO" in exch or "BSE" in exch or "BOM" in exch):
                return r
        for r in results:
            sym = (r.get("symbol") or "").upper()
            if pref == "NSE" and sym.endswith(".NS"):
                return r
            if pref == "BSE" and sym.endswith(".BO"):
                return r
    for r in results:
        if r.get("quoteType") in ("EQUITY", "ETF", "MUTUALFUND"):
            return r
    return results[0]


def _fetch_yahoo_chart_direct(symbol: str, period: str = "5d", interval: str = "15m") -> dict:
    """Fetch raw chart JSON directly from Yahoo Finance Chart API with robust headers."""
    # Map range for Yahoo API
    range_param = period.lower()
    if range_param == "1d":
        # Request 5d so we have full intraday candles even after hours or on weekends
        range_param = "5d"

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(symbol)}?range={range_param}&interval={interval}&includePrePost=false"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
    }
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            results = data.get("chart", {}).get("result")
            if results and len(results) > 0:
                return results[0]
    except Exception as e:
        print(f"Yahoo chart direct fetch failed for {symbol}:", e)
    return None


@cached(cache)
def fetch_stock_chart(symbol: str, period: str = "5d", interval: str = "15m") -> Tuple[dict, List[dict]]:
    """
    Fetches stock metadata and historical candle list.
    Handles aliases and after-hours session filtering.
    """
    clean_sym = symbol.strip().upper()
    resolved_sym = SYMBOL_ALIASES.get(clean_sym, clean_sym)

    result = _fetch_yahoo_chart_direct(resolved_sym, period=period, interval=interval)

    # If first attempt failed, try searching for the symbol
    if not result:
        base_name = clean_sym.replace(".NS", "").replace(".BO", "")
        search_res = yahoo_search(base_name)
        if search_res:
            alt_sym = search_res[0]["symbol"]
            if alt_sym != resolved_sym:
                result = _fetch_yahoo_chart_direct(alt_sym, period=period, interval=interval)

    if not result:
        return {}, []

    meta = result.get("meta", {})
    timestamps = result.get("timestamp", [])
    quote_data = result.get("indicators", {}).get("quote", [{}])[0]

    opens = quote_data.get("open", [])
    highs = quote_data.get("high", [])
    lows = quote_data.get("low", [])
    closes = quote_data.get("close", [])
    volumes = quote_data.get("volume", [])

    history_list: List[dict] = []
    ist = timezone(timedelta(hours=5, minutes=30))

    for i, ts in enumerate(timestamps):
        if i >= len(closes):
            break
        close_val = closes[i]
        if close_val is None:
            continue

        dt = datetime.fromtimestamp(ts, tz=ist)
        date_str = dt.strftime("%Y-%m-%d %H:%M:%S")

        history_list.append({
            "date": date_str,
            "datetime_obj": dt,
            "open": float(opens[i]) if i < len(opens) and opens[i] is not None else float(close_val),
            "high": float(highs[i]) if i < len(highs) and highs[i] is not None else float(close_val),
            "low": float(lows[i]) if i < len(lows) and lows[i] is not None else float(close_val),
            "close": float(close_val),
            "volume": int(volumes[i]) if i < len(volumes) and volumes[i] is not None else 0,
        })

    # If user selected 1D, trim candles to only include the latest active trading day (full 9:15 - 15:30)
    if period.lower() == "1d" and len(history_list) > 0:
        latest_date = history_list[-1]["datetime_obj"].date()
        history_list = [h for h in history_list if h["datetime_obj"].date() == latest_date]

    # Clean up internal datetime_obj before returning
    for h in history_list:
        h.pop("datetime_obj", None)

    return meta, history_list


def _downsample_history(history: List[dict], max_points: int) -> List[dict]:
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


def get_stock_data_by_symbol(yf_symbol: str, period: str = "5d", interval: str = "15m", max_points: int = 0, compact: bool = False) -> dict:
    """Direct lookup by Yahoo symbol."""
    if not yf_symbol or not str(yf_symbol).strip():
        return {"error": "symbol_required"}

    yf_symbol = yf_symbol.strip().upper()
    meta_raw, history = fetch_stock_chart(yf_symbol, period=period, interval=interval)

    if not history and not meta_raw:
        return {"error": "no_data_found", "symbol": yf_symbol}

    market_status = check_indian_market_status()

    resolved_price = (
        meta_raw.get("regularMarketPrice") or
        (history[-1]["close"] if history else None) or
        meta_raw.get("previousClose") or
        meta_raw.get("chartPreviousClose") or
        0
    )
    prev_close = meta_raw.get("previousClose") or meta_raw.get("chartPreviousClose") or resolved_price

    company_name = meta_raw.get("shortName") or meta_raw.get("longName") or yf_symbol.replace(".NS", "").replace(".BO", "")

    selected = {
        "symbol": yf_symbol,
        "shortname": company_name,
        "exchange": meta_raw.get("exchangeName") or "NSE",
        "quoteType": meta_raw.get("instrumentType") or "EQUITY",
    }

    meta = {
        "symbol": yf_symbol,
        "resolved_name": company_name,
        "currency": meta_raw.get("currency") or "INR",
        "regularMarketPrice": float(resolved_price),
        "previousClose": float(prev_close),
        "dayHigh": meta_raw.get("regularMarketDayHigh") or (max(h["high"] for h in history) if history else resolved_price),
        "dayLow": meta_raw.get("regularMarketDayLow") or (min(h["low"] for h in history) if history else resolved_price),
        "regularMarketVolume": meta_raw.get("regularMarketVolume") or 0,
        "isMarketOpen": market_status["isMarketOpen"],
        "marketState": market_status["marketState"],
        "marketHours": market_status["marketHours"],
        "statusMessage": market_status["statusMessage"],
    }

    if max_points and max_points > 0:
        history = _downsample_history(history, max_points)
    if compact:
        history = [{"date": h["date"], "close": h["close"]} for h in history]

    return {
        "selected": selected,
        "meta": meta,
        "history": history,
    }


def get_stock_data(company_name: str, preferred_exchange: str = "Auto", period: str = "5d", interval: str = "15m", max_points: int = 0, compact: bool = False) -> dict:
    """Search company name -> resolve symbol -> return stock data."""
    if not company_name or not company_name.strip():
        return {"error": "company_name is required"}
    company_name = company_name.strip()
    results = yahoo_search(company_name)
    selected = pick_best_symbol(results, company_name, preferred_exchange)
    if not selected:
        return {"error": "symbol_not_found", "search_results": results}
    yf_symbol = selected["symbol"]
    return get_stock_data_by_symbol(yf_symbol, period=period, interval=interval, max_points=max_points, compact=compact)
