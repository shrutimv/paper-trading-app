import os
from typing import Any, Dict, Optional

import requests

NEWSAPI_URL = "https://newsapi.org/v2/everything"
BASE_QUERY = "Indian stock market"


def _load_news_api_key() -> str:
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing NEWS_API_KEY environment variable. Set NEWS_API_KEY in API/.env."
        )
    return api_key


def _build_query(sector: Optional[str], industry: Optional[str], keyword: Optional[str]) -> str:
    query_parts = [BASE_QUERY]
    if sector:
        query_parts.append(str(sector).strip())
    if industry:
        query_parts.append(str(industry).strip())
    if keyword:
        query_parts.append(str(keyword).strip())
    return " ".join([part for part in query_parts if part])


def _normalize_article(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "title": raw.get("title") or "",
        "description": raw.get("description") or raw.get("content") or "",
        "url": raw.get("url") or "",
        "image": raw.get("urlToImage") or "",
        "published_at": raw.get("publishedAt") or "",
    }


def fetch_news(
    sector: Optional[str] = None,
    industry: Optional[str] = None,
    keyword: Optional[str] = None,
) -> Dict[str, Any]:
    api_key = _load_news_api_key()
    query = _build_query(sector, industry, keyword)
    params = {
        "q": query,
        "apiKey": api_key,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 25,
    }

    try:
        response = requests.get(NEWSAPI_URL, params=params, timeout=10)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"Failed to fetch news from NewsAPI: {exc}")

    if payload.get("status") != "ok":
        error_message = payload.get("message") or payload.get("status") or "Unknown NewsAPI error"
        raise RuntimeError(f"NewsAPI returned an error: {error_message}")

    articles = [_normalize_article(item) for item in payload.get("articles", [])]
    return {"status": "success", "query": query, "articles": articles}
