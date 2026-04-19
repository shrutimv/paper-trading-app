# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started
0. Go through the README.md in /API/ to run the API

check the ipv4 address of your system using the command 'ipconfig' in cmd and update the ipv4 address in /src/config.ts

1. Install dependencies

   ```bash
   npm install
   npm install axios
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

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
