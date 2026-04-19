# News API Module

This module adds a NewsAPI.org-powered news service for Indian stock market coverage.

## Setup

1. Create `API/.env` with:

```env
NEWS_API_KEY=your_api_key_here
```

2. Install backend dependencies from `API/requirements.txt`:

```bash
pip install -r API/requirements.txt
```

3. Start the backend from project root:

```bash
uvicorn API.app:app --reload
```

## Environment variables

- `NEWS_API_KEY` - required API key for NewsAPI.org

## Endpoints

### GET /news

Query parameters:

- `sector` (optional)
- `industry` (optional)
- `keyword` (optional)

Example requests:

```bash
curl "http://127.0.0.1:8000/news"
curl "http://127.0.0.1:8000/news?sector=finance"
curl "http://127.0.0.1:8000/news?sector=automobile&keyword=EV"
```

### Example response

```json
{
  "status": "success",
  "query": "Indian stock market finance banking",
  "articles": [
    {
      "title": "...",
      "description": "...",
      "url": "...",
      "image": "...",
      "published_at": "..."
    }
  ]
}
```

## Frontend integration

The frontend uses `src/api/newsApi.ts` and `components/NewsCarousel.tsx`.

- `fetchNews(sector, keyword, industry)` fetches from `/news`
- `NewsCarousel` displays cards, handles loading and errors, and auto-scrolls

## Cache explanation

- `API/news_cache.py` caches results for 15 minutes using `cachetools.TTLCache`
- It refreshes cached news automatically every 15 minutes to limit NewsAPI calls
- The API route returns cached news whenever available
