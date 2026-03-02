# Monee

Personal budget tracker PWA — connects to your Google Sheets budget spreadsheet.

## Setup

### 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project: **Monee**
3. Enable **Google Sheets API** (APIs & Services → Enable APIs)
4. Configure **OAuth consent screen**: External, add scope `https://www.googleapis.com/auth/spreadsheets`, add your email as test user
5. Create **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - After Vercel deploy, also add: `https://your-app.vercel.app/api/auth/callback/google`

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=   # generate: openssl rand -base64 32
GOOGLE_SPREADSHEET_ID=1yhmZ5aD581tB6ZVUoVkVAeY_wP81-49Frnn4wkFeA1k
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
npx vercel
```

Add the environment variables in Vercel dashboard (Project Settings → Environment Variables), then update the Google Cloud OAuth redirect URI with your Vercel domain.

### 5. iPhone Add to Home Screen

1. Open the Vercel URL in Safari
2. Tap the Share button → "Add to Home Screen"
3. Tap "Add" — the app will open as a standalone PWA

## Spreadsheet Structure

The app reads from the current month's tab (e.g. `Mar/2026`):
- **Budget/Used/Left**: cells B3:C5
- **Category totals**: cells B7:C11 (Food, Subscription, Chulsu, Personal, Others)

New entries are written to the correct day's column automatically based on the date you select.

## Categories

| Key | Name | Color |
|-----|------|-------|
| F | Food | Green |
| S | Subscription | Blue |
| C | Chulsu | Purple |
| P | Personal | Orange |
| O | Others | Gray |
