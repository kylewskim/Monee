# Monee

Personal budget tracker PWA — each user gets their own Google Drive spreadsheet.

## Setup

### 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project: **Monee**
3. Enable **Google Sheets API** and **Google Drive API**
4. Configure **OAuth consent screen** (External) and add these scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
5. Create **OAuth 2.0 Client ID** (Web application):
   - `http://localhost:3000/api/auth/callback/google`
   - Add your deployed domain callback as well

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=   # generate: openssl rand -base64 32
GOOGLE_TEMPLATE_SPREADSHEET_ID=your_template_spreadsheet_id
```

`GOOGLE_TEMPLATE_SPREADSHEET_ID` should point to your Monee template file that includes:
- `Template` sheet with the designed calendar layout
- 8-slot daily rows
- 6-week structure support

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

- On login, `/api/bootstrap` looks for the latest managed **Monee** spreadsheet in the user's Drive.
- If valid, dashboard loads immediately.
- If missing/invalid, onboarding (`/api/setup`) collects budget + categories and creates a fresh spreadsheet from template.
- Month tabs are `MMMYYYY` format (example: `Mar2026`) and are auto-created from `Template` when needed.

## Entry Rules

- Daily slot limit is fixed to **8**.
- If all 8 slots are filled for a date, entry is rejected with `409 DAY_SLOT_FULL`.
- No overwrite fallback is allowed.
