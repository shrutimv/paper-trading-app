"""
ml_recommender.py - Personalized ML Recommendation Engine for Stocks & News.
Uses multi-factor scoring (Risk-Return Optimization, Sector Affinity, Technical Momentum,
Portfolio Diversification) and Financial Sentiment NLP.
"""

from typing import List, Dict, Any, Optional
import math
import re

# Comprehensive Universe of top NSE/BSE stocks with fundamental & technical metrics
STOCK_UNIVERSE = [
    # Banking & Financial Services
    {
        "symbol": "HDFCBANK.NS",
        "name": "HDFC Bank Ltd",
        "sector": "Banking",
        "market_cap": "Large",
        "beta": 0.85,
        "pe": 18.2,
        "dividend_yield": 1.3,
        "volatility": "Low",
        "rsi": 48.5,
        "momentum_1m": 2.4,
        "price_approx": 688.0,
        "trend": "Bullish Consolidation",
    },
    {
        "symbol": "ICICIBANK.NS",
        "name": "ICICI Bank Ltd",
        "sector": "Banking",
        "market_cap": "Large",
        "beta": 0.95,
        "pe": 17.5,
        "dividend_yield": 0.9,
        "volatility": "Low",
        "rsi": 56.2,
        "momentum_1m": 4.8,
        "price_approx": 1395.0,
        "trend": "Strong Uptrend",
    },
    {
        "symbol": "SBIN.NS",
        "name": "State Bank of India",
        "sector": "Banking",
        "market_cap": "Large",
        "beta": 1.15,
        "pe": 10.4,
        "dividend_yield": 1.6,
        "volatility": "Moderate",
        "rsi": 54.0,
        "momentum_1m": 3.6,
        "price_approx": 960.0,
        "trend": "Uptrend",
    },
    {
        "symbol": "BAJFINANCE.NS",
        "name": "Bajaj Finance Ltd",
        "sector": "Banking",
        "market_cap": "Large",
        "beta": 1.35,
        "pe": 28.5,
        "dividend_yield": 0.5,
        "volatility": "High",
        "rsi": 62.0,
        "momentum_1m": 7.2,
        "price_approx": 7200.0,
        "trend": "Breakout",
    },

    # Information Technology
    {
        "symbol": "TCS.NS",
        "name": "Tata Consultancy Services",
        "sector": "IT",
        "market_cap": "Large",
        "beta": 0.72,
        "pe": 28.0,
        "dividend_yield": 1.8,
        "volatility": "Low",
        "rsi": 51.0,
        "momentum_1m": 1.8,
        "price_approx": 2530.0,
        "trend": "Stable Bluechip",
    },
    {
        "symbol": "INFY.NS",
        "name": "Infosys Ltd",
        "sector": "IT",
        "market_cap": "Large",
        "beta": 0.92,
        "pe": 25.1,
        "dividend_yield": 2.1,
        "volatility": "Moderate",
        "rsi": 58.5,
        "momentum_1m": 5.2,
        "price_approx": 1150.0,
        "trend": "Uptrend",
    },
    {
        "symbol": "HCLTECH.NS",
        "name": "HCL Technologies Ltd",
        "sector": "IT",
        "market_cap": "Large",
        "beta": 0.88,
        "pe": 23.4,
        "dividend_yield": 2.8,
        "volatility": "Low",
        "rsi": 55.0,
        "momentum_1m": 3.9,
        "price_approx": 1780.0,
        "trend": "High Dividend Uptrend",
    },

    # Energy & Oil
    {
        "symbol": "RELIANCE.NS",
        "name": "Reliance Industries Ltd",
        "sector": "Energy",
        "market_cap": "Large",
        "beta": 0.98,
        "pe": 24.5,
        "dividend_yield": 0.4,
        "volatility": "Moderate",
        "rsi": 52.3,
        "momentum_1m": 3.1,
        "price_approx": 1202.0,
        "trend": "Sector Leader",
    },
    {
        "symbol": "NTPC.NS",
        "name": "NTPC Limited",
        "sector": "Energy",
        "market_cap": "Large",
        "beta": 0.82,
        "pe": 16.8,
        "dividend_yield": 2.4,
        "volatility": "Low",
        "rsi": 49.0,
        "momentum_1m": 2.1,
        "price_approx": 410.0,
        "trend": "Defensive Growth",
    },
    {
        "symbol": "ADANIGREEN.NS",
        "name": "Adani Green Energy Ltd",
        "sector": "Energy",
        "market_cap": "Mid",
        "beta": 1.65,
        "pe": 110.0,
        "dividend_yield": 0.0,
        "volatility": "High",
        "rsi": 66.0,
        "momentum_1m": 12.8,
        "price_approx": 1820.0,
        "trend": "High Beta Momentum",
    },

    # Automobile
    {
        "symbol": "TATAMOTORS.NS",
        "name": "Tata Motors Ltd",
        "sector": "Automobile",
        "market_cap": "Large",
        "beta": 1.45,
        "pe": 11.2,
        "dividend_yield": 0.7,
        "volatility": "High",
        "rsi": 63.5,
        "momentum_1m": 8.4,
        "price_approx": 389.0,
        "trend": "Commercial & EV Breakout",
    },
    {
        "symbol": "M&M.NS",
        "name": "Mahindra & Mahindra Ltd",
        "sector": "Automobile",
        "market_cap": "Large",
        "beta": 1.05,
        "pe": 26.0,
        "dividend_yield": 0.8,
        "volatility": "Moderate",
        "rsi": 59.0,
        "momentum_1m": 6.1,
        "price_approx": 2940.0,
        "trend": "SUV Leadership",
    },
    {
        "symbol": "MARUTI.NS",
        "name": "Maruti Suzuki India Ltd",
        "sector": "Automobile",
        "market_cap": "Large",
        "beta": 0.78,
        "pe": 26.5,
        "dividend_yield": 1.0,
        "volatility": "Low",
        "rsi": 47.0,
        "momentum_1m": 1.2,
        "price_approx": 12100.0,
        "trend": "Market Anchor",
    },

    # FMCG & Consumer
    {
        "symbol": "ITC.NS",
        "name": "ITC Ltd",
        "sector": "FMCG",
        "market_cap": "Large",
        "beta": 0.65,
        "pe": 27.0,
        "dividend_yield": 3.2,
        "volatility": "Low",
        "rsi": 46.0,
        "momentum_1m": 1.5,
        "price_approx": 260.0,
        "trend": "Defensive High Yield",
    },
    {
        "symbol": "HINDUNILVR.NS",
        "name": "Hindustan Unilever Ltd",
        "sector": "FMCG",
        "market_cap": "Large",
        "beta": 0.68,
        "pe": 54.0,
        "dividend_yield": 1.6,
        "volatility": "Low",
        "rsi": 44.5,
        "momentum_1m": 0.8,
        "price_approx": 2650.0,
        "trend": "Defensive Value",
    },
    {
        "symbol": "ETERNAL.NS",
        "name": "Zomato Ltd (Eternal)",
        "sector": "FMCG",
        "market_cap": "Large",
        "beta": 1.55,
        "pe": 95.0,
        "dividend_yield": 0.0,
        "volatility": "High",
        "rsi": 68.0,
        "momentum_1m": 14.5,
        "price_approx": 327.0,
        "trend": "High Growth Tech Consumer",
    },

    # Healthcare & Pharma
    {
        "symbol": "SUNPHARMA.NS",
        "name": "Sun Pharmaceutical Inds",
        "sector": "Pharma",
        "market_cap": "Large",
        "beta": 0.70,
        "pe": 34.0,
        "dividend_yield": 0.9,
        "volatility": "Low",
        "rsi": 53.0,
        "momentum_1m": 3.8,
        "price_approx": 1820.0,
        "trend": "Global Healthcare Steady",
    },
    {
        "symbol": "CIPLA.NS",
        "name": "Cipla Ltd",
        "sector": "Pharma",
        "market_cap": "Large",
        "beta": 0.74,
        "pe": 26.5,
        "dividend_yield": 0.9,
        "volatility": "Low",
        "rsi": 51.5,
        "momentum_1m": 2.7,
        "price_approx": 1560.0,
        "trend": "Consolidation",
    },

    # Infrastructure & Metals
    {
        "symbol": "LT.NS",
        "name": "Larsen & Toubro Ltd",
        "sector": "Infrastructure",
        "market_cap": "Large",
        "beta": 1.08,
        "pe": 32.0,
        "dividend_yield": 0.9,
        "volatility": "Moderate",
        "rsi": 57.0,
        "momentum_1m": 4.5,
        "price_approx": 3550.0,
        "trend": "Capex Supercycle",
    },
    {
        "symbol": "TATASTEEL.NS",
        "name": "Tata Steel Ltd",
        "sector": "Metals",
        "market_cap": "Large",
        "beta": 1.40,
        "pe": 16.0,
        "dividend_yield": 2.2,
        "volatility": "High",
        "rsi": 53.0,
        "momentum_1m": 4.1,
        "price_approx": 152.0,
        "trend": "Commodity Rebound",
    },
]

# --- Sentiment Lexicon for Financial NLP ---
BULLISH_KEYWORDS = [
    "profit", "surge", "record", "jump", "growth", "high", "rally", "gain", "bull", "upgrade",
    "dividend", "acquisition", "outperform", "expansion", "order win", "revenue up", "soars",
    "positive", "robust", "strong", "beat", "green", "breakout", "demand", "invest"
]

BEARISH_KEYWORDS = [
    "loss", "fall", "drop", "plunge", "slump", "down", "bear", "downgrade", "probe", "fraud",
    "penalty", "miss", "revenue down", "crash", "negative", "weak", "debt", "curb", "warning",
    "inflation", "recession", "strike", "dispute", "investigation"
]


def score_news_sentiment(title: str, description: str = "") -> Dict[str, Any]:
    """
    NLP sentiment scoring engine for financial news.
    Returns sentiment tag ('BULLISH'|'BEARISH'|'NEUTRAL'), polarity score (-1.0 to +1.0),
    and detected impact keywords.
    """
    text = f"{title} {description}".lower()
    found_bullish = [w for w in BULLISH_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', text)]
    found_bearish = [w for w in BEARISH_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', text)]

    bull_score = len(found_bullish)
    bear_score = len(found_bearish)

    total = bull_score + bear_score
    if total == 0:
        return {
            "sentiment": "NEUTRAL",
            "score": 0.0,
            "confidence": 0.70,
            "keywords": [],
        }

    raw_polarity = (bull_score - bear_score) / total

    if raw_polarity >= 0.25:
        sentiment = "BULLISH"
    elif raw_polarity <= -0.25:
        sentiment = "BEARISH"
    else:
        sentiment = "NEUTRAL"

    confidence = min(0.98, 0.72 + (total * 0.05))

    return {
        "sentiment": sentiment,
        "score": round(raw_polarity, 2),
        "confidence": round(confidence, 2),
        "keywords": (found_bullish + found_bearish)[:5],
    }


def calculate_stock_score(
    stock: Dict[str, Any],
    risk_profile: str,
    preferred_sectors: List[str],
    user_holdings: List[str],
    viewed_stocks: List[str],
    trade_history: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Multi-factor scoring algorithm:
    1. Risk Profile Alignment (30%)
    2. Trade History & Buying/Selling Behavior (20%)
    3. Sector Affinity (20%)
    4. Momentum & Technical Health (15%)
    5. Browsing Interest (10%)
    6. Portfolio Diversification (5%)
    """
    risk_profile = (risk_profile or "MODERATE").upper()
    user_holdings_clean = [h.upper().replace(".NS", "") for h in user_holdings]
    viewed_clean = [v.upper().replace(".NS", "") for v in viewed_stocks]
    pref_sectors_clean = [s.strip().upper() for s in preferred_sectors]
    trades_clean = [t.upper().replace(".NS", "") for t in (trade_history or [])]

    symbol_clean = stock["symbol"].replace(".NS", "").upper()
    sector_upper = stock["sector"].upper()
    beta = stock["beta"]
    rsi = stock["rsi"]
    momentum = stock["momentum_1m"]
    div_yield = stock["dividend_yield"]

    # 1. Risk Profile Score (0-30)
    risk_score = 0
    if risk_profile == "CONSERVATIVE":
        if beta <= 0.85:
            risk_score += 22
        elif beta <= 1.05:
            risk_score += 14
        else:
            risk_score += 5
        if div_yield >= 1.5:
            risk_score += 8
    elif risk_profile == "AGGRESSIVE":
        if beta >= 1.25:
            risk_score += 22
        elif beta >= 1.0:
            risk_score += 14
        else:
            risk_score += 5
        if momentum >= 6.0:
            risk_score += 8
    else:  # MODERATE
        if 0.85 <= beta <= 1.25:
            risk_score += 22
        else:
            risk_score += 12
        if 3.0 <= momentum <= 9.0:
            risk_score += 8

    # 2. Trade History Alignment (0-20) - Personalized to user's buying/selling!
    trade_score = 0
    has_traded_same_symbol = symbol_clean in trades_clean
    has_traded_same_sector = any(
        s["sector"].upper() == sector_upper
        for s in STOCK_UNIVERSE
        if s["symbol"].replace(".NS", "").upper() in trades_clean
    )

    if has_traded_same_symbol:
        trade_score = 18  # High affinity from direct trading
    elif has_traded_same_sector:
        trade_score = 15  # Sector familiarity from trade activity
    elif len(trades_clean) > 0:
        trade_score = 6   # Diversification across trade history
    else:
        trade_score = 10  # Neutral baseline for new traders

    # 3. Sector Affinity Score (0-20)
    sector_score = 8
    if pref_sectors_clean:
        if any(p in sector_upper for p in pref_sectors_clean):
            sector_score = 20
    else:
        sector_score = 14

    # 4. Technical Momentum & RSI Health (0-15)
    momentum_score = 0
    if 45 <= rsi <= 62:
        momentum_score += 9
    elif rsi < 35:
        momentum_score += 7
    else:
        momentum_score += 4
    if momentum > 0:
        momentum_score += min(6, int(momentum))

    # 5. Browsing Interest (0-10)
    interest_score = 0
    if symbol_clean in viewed_clean:
        interest_score = 10
    elif any(sector_upper in s for s in pref_sectors_clean):
        interest_score = 6
    else:
        interest_score = 3

    # 6. Diversification Bonus (0-5)
    diversification_score = 5
    if symbol_clean in user_holdings_clean:
        diversification_score = 1

    total_score = risk_score + trade_score + sector_score + momentum_score + interest_score + diversification_score
    match_percentage = min(98, max(58, total_score))

    # Generate Personalized Explainable AI Rationale
    rationale_parts = []
    if has_traded_same_symbol:
        rationale_parts.append(f"Personalized: Based on your recent trading history in {symbol_clean}.")
    elif has_traded_same_sector:
        rationale_parts.append(f"Personalized: Matches your frequent trading in the {stock['sector']} sector.")
    elif risk_profile == "CONSERVATIVE":
        rationale_parts.append(f"Low-volatility large cap (Beta {beta}) fitting your wealth preservation profile.")
    elif risk_profile == "AGGRESSIVE":
        rationale_parts.append(f"High-growth setup (Beta {beta}) with +{momentum}% 1-month momentum.")
    else:
        rationale_parts.append(f"Balanced risk-reward profile in the {stock['sector']} sector.")

    if div_yield >= 1.5:
        rationale_parts.append(f"Attractive {div_yield}% dividend yield.")
    elif rsi >= 58:
        rationale_parts.append(f"Positive momentum (RSI {rsi}) with healthy accumulation.")

    action = "Strong Buy" if match_percentage >= 85 else "Accumulate" if match_percentage >= 72 else "Watchlist"
    risk_level = "Low Risk" if beta < 0.9 else "High Growth" if beta > 1.25 else "Moderate Risk"

    return {
        "symbol": stock["symbol"],
        "name": stock["name"],
        "sector": stock["sector"],
        "market_cap": stock["market_cap"],
        "price": stock["price_approx"],
        "beta": stock["beta"],
        "rsi": stock["rsi"],
        "momentum_1m": stock["momentum_1m"],
        "trend": stock["trend"],
        "match_score": match_percentage,
        "action": action,
        "risk_level": risk_level,
        "rationale": " ".join(rationale_parts),
    }


def recommend_stocks(
    risk_profile: str = "MODERATE",
    preferred_sectors: Optional[List[str]] = None,
    user_holdings: Optional[List[str]] = None,
    viewed_stocks: Optional[List[str]] = None,
    trade_history: Optional[List[str]] = None,
    limit: int = 6
) -> List[Dict[str, Any]]:
    """
    Generates personalized stock recommendations for the current user based on
    their risk appetite, preferred sectors, and buying/selling trade history.
    """
    preferred_sectors = preferred_sectors or []
    user_holdings = user_holdings or []
    viewed_stocks = viewed_stocks or []
    trade_history = trade_history or []

    scored_stocks = [
        calculate_stock_score(stock, risk_profile, preferred_sectors, user_holdings, viewed_stocks, trade_history)
        for stock in STOCK_UNIVERSE
    ]

    scored_stocks.sort(key=lambda s: s["match_score"], reverse=True)
    return scored_stocks[:limit]

