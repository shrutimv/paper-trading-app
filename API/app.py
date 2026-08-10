# app.py
import os
from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from dotenv import load_dotenv
from API.logic import (
    get_stock_data,
    get_stock_history,
    get_stock_data_by_symbol,
    yahoo_search,
    get_live_ipos,
    get_market_screener_data
)
from API.news_cache import news_cache
from API.news_service import fetch_news

load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI(title="Stock Lookup & Paper Trading API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup_news_cache() -> None:
    await news_cache.start_background_refresh()


@app.get("/news")
def news(
    sector: Optional[str] = Query(None, description="Optional industry sector filter"),
    industry: Optional[str] = Query(None, description="Optional industry filter"),
    keyword: Optional[str] = Query(None, description="Optional keyword filter"),
):
    cached = news_cache.get(sector, industry, keyword)
    if cached:
        return cached

    try:
        result = fetch_news(sector=sector, industry=industry, keyword=keyword)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    news_cache.set(sector, industry, keyword, value=result)
    return result


@app.get("/ipos")
def ipos():
    """
    GET /ipos
    Returns dynamic list of live, upcoming, and recent Mainboard & SME IPOs in India.
    """
    return {"ipos": get_live_ipos()}


@app.get("/screener")
def screener(
    category: Optional[str] = Query(None, description="Filter: volume_shockers | breakouts_52w | golden_crossover | oversold_rsi | value_picks")
):
    """
    GET /screener?category=volume_shockers
    Returns categorized high-momentum stock scanners with actionable trade setups.
    """
    data = get_market_screener_data()
    if category and category in data:
        return {"category": category, "stocks": data[category]}
    return {"screener": data}


@app.get("/search")
def search(
    q: str = Query(..., min_length=1, description="Query string (company name or partial)"),
    exchange: str = Query("Auto", description="Preferred exchange: Auto|NSE|BSE|Any"),
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
):
    """
    GET /search?q=godrej&exchange=NSE&limit=50
    Returns normalized list of matching tickers, also checking IPO registry.
    """
    raw = yahoo_search(q)
    pref = (exchange or "Auto").upper()
    out = []

    for item in raw:
        if pref in ("NSE", "BSE"):
            exch = (item.get("exchange") or "").upper()
            sym = (item.get("symbol") or "").upper()
            if pref == "NSE" and (".NS" in sym or "NS" in exch or "NSE" in exch):
                out.append(item)
            elif pref == "BSE" and (".BO" in sym or "BOM" in exch or "BSE" in exch or "BO" in exch):
                out.append(item)
            else:
                continue
        else:
            out.append(item)
        if len(out) >= limit:
            break

    return {"results": out}


@app.get("/stock")
def stock(
    company: Optional[str] = Query("", description="Company name (used when symbol not provided)"),
    symbol: Optional[str] = Query(None, description="Direct Yahoo-format symbol e.g. 'TCS.NS' or '532540.BO'"),
    exchange: str = Query("Auto", description="Preferred exchange: Auto | NSE | BSE"),
    period: str = Query("5Y", description="yfinance period (e.g. 1Y, 6mo, 5Y)"),
    interval: str = Query("1d", description="yfinance interval (1d, 1wk, 1mo)"),
    max_points: int = Query(0, description="If >0, downsample history to at most this many points"),
    compact: bool = Query(False, description="If true, history returns only date+close")
):
    """
    GET /stock?company=...&exchange=...&period=5Y&interval=1d&max_points=300&compact=true
    Or direct: /stock?symbol=TCS.NS
    """
    if symbol:
        result = get_stock_data_by_symbol(symbol, period=period, interval=interval, max_points=max_points, compact=compact)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result)
        return result

    if not company or not company.strip():
        raise HTTPException(status_code=400, detail={"error": "company parameter required when symbol is not provided"})

    result = get_stock_data(company, preferred_exchange=exchange, period=period, interval=interval,
                            max_points=max_points, compact=compact)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result)
    return result
