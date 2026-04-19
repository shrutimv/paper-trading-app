import asyncio
from typing import Any, Dict, Optional, Tuple

from cachetools import TTLCache

from .news_service import fetch_news

CACHE_TTL_SECONDS = 900
CACHE_MAXSIZE = 50
DEFAULT_KEY = ("", "", "")


class NewsCache:
    def __init__(self) -> None:
        self._cache: TTLCache[Tuple[str, str, str], Dict[str, Any]] = TTLCache(
            maxsize=CACHE_MAXSIZE, ttl=CACHE_TTL_SECONDS
        )
        self._lock = asyncio.Lock()
        self._task: Optional[asyncio.Task] = None

    def _key(
        self,
        sector: Optional[str],
        industry: Optional[str],
        keyword: Optional[str],
    ) -> Tuple[str, str, str]:
        return (sector or "", industry or "", keyword or "")

    def get(
        self,
        sector: Optional[str] = None,
        industry: Optional[str] = None,
        keyword: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        return self._cache.get(self._key(sector, industry, keyword))

    def set(
        self,
        sector: Optional[str] = None,
        industry: Optional[str] = None,
        keyword: Optional[str] = None,
        value: Optional[Dict[str, Any]] = None,
    ) -> None:
        if value is None:
            return
        self._cache[self._key(sector, industry, keyword)] = value

    async def start_background_refresh(self) -> None:
        if self._task is not None:
            return
        self._task = asyncio.create_task(self._refresh_loop())
        try:
            await self._refresh_key(*DEFAULT_KEY)
        except Exception:
            pass

    async def _refresh_loop(self) -> None:
        await asyncio.sleep(CACHE_TTL_SECONDS)
        while True:
            keys = list(self._cache.keys()) or [DEFAULT_KEY]
            for key in keys:
                try:
                    await self._refresh_key(*key)
                except Exception:
                    pass
            await asyncio.sleep(CACHE_TTL_SECONDS)

    async def _refresh_key(
        self, sector: Optional[str], industry: Optional[str], keyword: Optional[str]
    ) -> None:
        key = self._key(sector, industry, keyword)
        result = await asyncio.to_thread(fetch_news, sector, industry, keyword)
        async with self._lock:
            self._cache[key] = result


news_cache = NewsCache()
