# Paper Trading Application 📈

This is a full-stack paper trading application with a FastAPI backend and React Native Expo frontend.

---

## 🚀 Complete Setup Guide

### Prerequisites
- Python 3.8+
- Node.js 16+
- Expo CLI installed globally (`npm install -g expo-cli`)

---

## Part 1: Backend API Setup

### Step 1: Create `.env` file in `/API` directory

Navigate to the `/API` folder and create a `.env` file with the following content:

```
NEWS_API_KEY=your_newsapi_org_key_here
```

**Path:** `D:\VESIT\Project\PaperTradeApplication\paper-trading-app\API\.env`

Get your NEWS_API_KEY from [newsapi.org](https://newsapi.org)

### Step 2: Install API dependencies

From the project root directory:

```bash
# From: D:\VESIT\Project\PaperTradeApplication\paper-trading-app

pip install -r API/requirements.txt
```

### Step 3: Start the FastAPI server

From the project root directory:

```bash
# From: D:\VESIT\Project\PaperTradeApplication\paper-trading-app

uvicorn API.app:app --reload --host 0.0.0.0 --port 8000
```

✅ You should see: `Uvicorn running on http://0.0.0.0:8000`

The API will be accessible at:
- **Local:** `http://localhost:8000`
- **Network:** `http://<your-ipv4-address>:8000` (e.g., `http://192.168.0.105:8000`)

---

## Part 2: Frontend Setup

### Step 1: Find your IPv4 address

Run in PowerShell/Command Prompt:

```bash
ipconfig
```

Look for "IPv4 Address" (usually starts with 192.168.x.x or 10.0.x.x)

### Step 2: Update API endpoint in config

Edit the file: `src/config.ts`

Update the API URL with your IPv4 address:

```typescript
export const API_BASE_URL = 'http://192.168.0.105:8000'; // Replace 192.168.0.105 with your IPv4
```

### Step 3: Install frontend dependencies

From the project root directory:

```bash
# From: D:\VESIT\Project\PaperTradeApplication\paper-trading-app

npm install
npm install axios
```

### Step 4: Start the Expo development server

From the project root directory:

```bash
# From: D:\VESIT\Project\PaperTradeApplication\paper-trading-app

npx expo start
```

In the output, you'll find options to open the app in a

- [Expo Go](https://expo.dev/go) - Scan QR code with your phone
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Web browser](https://docs.expo.dev/workflow/web/)

---

## 🔄 Running Both Backend and Frontend Together

**Terminal 1 - Start Backend API:**

```bash
cd D:\VESIT\Project\PaperTradeApplication\paper-trading-app
uvicorn API.app:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Start Frontend:**

```bash
cd D:\VESIT\Project\PaperTradeApplication\paper-trading-app
npx expo start
```

Both servers should now be running and the app can communicate with the backend.

---

## ⚙️ Configuration Checklist

- [ ] Created `.env` file in `/API` directory with `NEWS_API_KEY`
- [ ] Updated IPv4 address in `src/config.ts`
- [ ] Installed API requirements: `pip install -r API/requirements.txt`
- [ ] Installed frontend dependencies: `npm install && npm install axios`
- [ ] Backend running on port 8000
- [ ] Frontend running (Expo dev server)
- [ ] Mobile device/emulator connected on same Wi-Fi network (for testing on actual device)

---

## 🐛 Troubleshooting

### API connection refused error
- Ensure API server is running: `uvicorn API.app:app --reload --host 0.0.0.0 --port 8000`
- Verify IPv4 address is correct in `src/config.ts`
- Check firewall allows port 8000

### `ModuleNotFoundError: No module named 'API'`
- Make sure you're running uvicorn from the **project root** directory
- Correct: `D:\VESIT\Project\PaperTradeApplication\paper-trading-app>`
- Wrong: `D:\VESIT\Project\PaperTradeApplication\paper-trading-app\API>`

### News endpoint not working
- Verify `NEWS_API_KEY` is set in `API/.env`
- Check that the key is valid at [newsapi.org](https://newsapi.org)

---

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## NEWS API MODULE

This project now includes a News API integration for Indian stock market news.

### Setup

1. Add your NewsAPI.org key to `API/.env`:

```env
NEWS_API_KEY=your_api_key_here
```

2. Install backend dependencies:

```bash
pip install -r API/requirements.txt
```

3. Start the backend:

```bash
uvicorn API.app:app --reload
```

4. Confirm the endpoint works:

```bash
curl "http://192.168.0.105:8000/news"
```

### Frontend

- `components/NewsCarousel.tsx` loads `/news` and displays horizontal news cards.
- `src/api/newsApi.ts` provides `fetchNews(sector?, keyword?, industry?)`.
- The home screen in `app/(tabs)/index.tsx` now renders the news carousel.

### Notes

- The backend caches news and refreshes every 15 minutes via `API/news_cache.py`.
- Use your local LAN IP in `src/config.ts` if needed.
