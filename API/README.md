# Stock Lookup API (FastAPI) — local run instructions

# As a windows user you should run the powershell commands(Step 2) followed by Run the API command(Step 3)


## 1) Create folder & files
Place the files `requirements.txt`, `logic.py`, and `app.py` in a folder.

## 2) Create virtual environment & install
On Linux/macOS:
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt

On Windows (PowerShell):
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  pip install -r requirements.txt

## 3) Run the API locally
  uvicorn app:app --reload --host 0.0.0.0 --port 8000

This will start the server on port 8000.

## 4) Test endpoints
Health check:
  curl http://localhost:8000/health
  -> {"status":"ok"}

Stock query example:
  curl "http://localhost:8000/stock?company=Tata%20Consultancy%20Services&exchange=NSE"

Response JSON contains:
  - selected: the resolved Yahoo symbol & shortname & exchange
  - meta: compact metadata (symbol, resolved_name, price, marketCap etc.)
  - history: list of daily rows [{date, open, high, low, close, volume}, ...]

## 5) If testing from a phone or physical device on the same Wi-Fi:
- Replace 'localhost' in the mobile app with your machine's LAN IP, e.g.:
  http://192.168.1.12:8000
- On Android emulator (Android Studio), use: http://10.0.2.2:8000
- Make sure local firewall allows incoming connections to port 8000.

## 6) Running Both Backend and Frontend Together

To run the complete application (backend + frontend):

### Backend (FastAPI):
From the project root directory (`paper-trading-app/`):
```bash
uvicorn API.app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Expo React Native):
Open a new terminal and from the project root:
```bash
npm start
# or
expo start
```

This will start:
- Backend API on `http://0.0.0.0:8000` (accessible at your LAN IP, e.g., `http://192.168.0.105:8000`)
- Frontend Expo dev server (typically on `http://localhost:8081`)

### Testing the Full Application:
1. Backend should show: "Uvicorn running on http://0.0.0.0:8000"
2. Frontend will open Expo DevTools in your browser
3. Use Expo Go app on your phone to scan the QR code, or run on simulator/emulator
4. The app will connect to the backend automatically (IP configured in `src/config.ts`)

### Troubleshooting:
- If port 8081 is busy, Expo will ask to use 8082
- Ensure both terminals remain open
- Check firewall settings for backend port 8000

## 7) Notes and next steps
- This server uses simple in-memory caching (TTLCache) to reduce yfinance/Yahoo hits for repeated queries.
- For production you should:
  - Serve via HTTPS
  - Protect the API (API key/auth) if needed
  - Optionally deploy in a container or platform like Render/Railway
  - Add logging and monitoring
