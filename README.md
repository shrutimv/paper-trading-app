# Paper Trading Application 📈

A full-stack, real-time paper trading application featuring a **React Native Expo** mobile frontend, a **Node.js Express** backend (handling authentication and trades), and a **Python FastAPI** service (powering live stock market data, charts, IPO hubs, and news).

---

## 🏗️ Architecture Overview

The project consists of three main components:
1. **Frontend (`/`)**: React Native Expo mobile application.
2. **Express Backend (`/backend`)**: Node.js & Express server handling user registration, authentication, sessions, and database schema for portfolio trades. Powered by MongoDB.
3. **FastAPI Engine (`/API`)**: Python FastAPI server providing real-time stock price simulation, market charts, IPO details, and Indian stock market news cached from NewsAPI.

---

## ⚙️ Environment Configuration

To keep the application secure, sensitive configurations are kept in `.env` files. Template files (`.env.example`) are provided to show the required variables.

### 1. Express Backend Setup (`/backend/.env`)
Create a `.env` file inside the `backend/` directory (or use the one in the root folder) and configure the following variables:
* `PORT`: The port on which the Express server runs (default: `5000`).
* `MONGO_URI`: Your MongoDB database connection string.
* `SESSION_SECRET`: A secure, secret key used to sign Express session cookies.
* `FASTAPI_URL`: The URL of the FastAPI service (default: `http://localhost:8000`).

### 2. FastAPI Setup (`/API/.env`)
Create a `.env` file inside the `API/` directory and configure:
* `NEWS_API_KEY`: Your developer key from [newsapi.org](https://newsapi.org) to fetch live financial news.

---

## 🚀 Complete Setup Guide

### Prerequisites
* **Node.js** (v16 or higher)
* **Python 3.8+**
* **MongoDB** (Atlas cloud cluster or local database)

---

### Part 1: Express Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file using the template:
   ```bash
   # Copy template and fill in your MONGO_URI and SESSION_SECRET
   cp .env.example .env
   ```

4. Start the Express server:
   ```bash
   # Run with Nodemon for development
   npm run dev
   # Or run directly with Node
   node app.js
   ```
   *The backend will run on `http://localhost:5000`.*

---

### Part 2: FastAPI Engine Setup

1. Navigate to the `API` directory:
   ```bash
   cd API
   ```

2. Create a virtual environment and activate it:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the `.env` file using the template:
   ```bash
   # Copy template and fill in your NEWS_API_KEY
   cp .env.example .env
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```
   *The FastAPI engine will run on `http://localhost:8000`.*

---

### Part 3: React Native Frontend Setup

1. Navigate to the root directory of the project.

2. Configure Server Endpoints:
   * **FastAPI Service URL**: Update `src/config.ts` with your local IP address (or `localhost` for emulators):
     ```typescript
     export const API_BASE_URL = 'http://<your-pc-ip-address>:8000';
     ```
   * **Express Service URL**: Update `src/config/api.ts` with your local IP address:
     ```typescript
     export const BASE_URL = 'http://<your-pc-ip-address>:5000';
     ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

5. Run the app:
   * Scan the QR code using the **Expo Go** app on your phone (ensure your phone and PC are on the same Wi-Fi network).
   * Press `a` for Android emulator or `i` for iOS simulator.

---

## 🐛 Troubleshooting

* **Connection Refused (Port 5000 or 8000)**:
  * Ensure both servers are running in separate terminal windows.
  * Verify that the IP address specified in `src/config.ts` and `src/config/api.ts` matches your PC's current IPv4 address (run `ipconfig` on Windows or `ifconfig` on macOS).
  * Double-check that your firewall allows traffic on ports 5000 and 8000.
* **Database Connection Errors**:
  * Verify that the database connection string in your `.env` is correct.
  * Ensure your MongoDB Atlas cluster has IP Access list configured to allow your current IP address.
