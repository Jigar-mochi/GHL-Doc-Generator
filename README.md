# TAD Generator — Technical Approach Document Generator for Go High Level

Generate professional Technical Approach Documents from client call recordings or notes. Upload audio/video, paste text, or provide a transcript — the app transcribes, generates a comprehensive 17-section TAD using AI, exports it as PDF + DOCX, and uploads both to Google Drive automatically.

---

## Features

- 🎙️ **Audio/Video Transcription** — Groq Whisper (whisper-large-v3) transcribes recordings up to 25MB
- 🤖 **AI Document Generation** — Llama 3.3-70b generates a 17-section professional TAD
- 📄 **PDF + DOCX Export** — Cover page, TOC, all sections, headers/footers, blue theme
- ☁️ **Google Drive Upload** — Auto-creates project folder, uploads both files, returns sharing links
- 🔒 **No Local Storage** — All processing is in-memory; nothing is written to disk

---

## Prerequisites

- **Node.js 18+** (Node 20 recommended)
- **Groq API Key** — [console.groq.com](https://console.groq.com)
- **Google Cloud Project** with OAuth2 credentials (see setup below)

---

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **Google Drive API**: APIs & Services → Enable APIs → search "Google Drive API"
4. Create OAuth2 credentials:
   - Go to APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:5000/api/auth/callback`
   - Copy the **Client ID** and **Client Secret**
5. Configure OAuth Consent Screen:
   - User Type: External (or Internal if using Google Workspace)
   - Add your email as a test user
   - Scopes: add `https://www.googleapis.com/auth/drive.file`
6. Get your **Drive Parent Folder ID** (see section below)

---

## Getting GOOGLE_DRIVE_PARENT_FOLDER_ID

1. Open [Google Drive](https://drive.google.com)
2. Create a folder named e.g. "TAD Projects"
3. Open the folder — the URL will be: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
4. Copy the ID after `/folders/` — that's your `GOOGLE_DRIVE_PARENT_FOLDER_ID`

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd tad-generator

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Environment Setup

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
# Groq AI — get from console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# Google OAuth2
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback

# Google Drive — ID of the parent folder for all project folders
GOOGLE_DRIVE_PARENT_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWx

# Server
PORT=5000
CLIENT_URL=http://localhost:5173
```

---

## Running in Development

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Then open: [http://localhost:5173](http://localhost:5173)

---

## Usage Walkthrough

1. **Open the app** at `http://localhost:5173`
2. **Connect Google Drive** — click "Connect Google Drive" → authorize in Google popup
3. **Fill in the form**:
   - Optionally enter Client Name and Project Name
   - Paste client message/notes in the textarea, AND/OR
   - Upload an audio recording, video, PDF, DOCX, or TXT file
4. **Click "Generate Technical Approach Document"**
5. **Watch progress** — steps update in real-time as the backend processes
6. **Download your documents** — PDF and DOCX links appear when complete, all saved to Google Drive

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite)                       │
│  React 18 + TailwindCSS + shadcn-style components            │
│  Home → UploadZone → StepIndicator → ResultCard              │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP (axios, /api proxy)
┌───────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Express)                          │
│                                                               │
│  POST /api/generate                                           │
│    │                                                          │
│    ├── 1. multer memoryStorage → file Buffer in RAM           │
│    ├── 2. transcriptionService → Groq Whisper API             │
│    │      (Buffer → File → Whisper → text)                   │
│    ├── 3. aiService → Groq llama-3.3-70b                     │
│    │      (prompt → JSON TAD object)                         │
│    ├── 4. documentService → pdf-lib + docx                   │
│    │      (TAD object → PDF Buffer + DOCX Buffer)            │
│    └── 5. driveService → Google Drive API v3                 │
│           (Buffers → Readable streams → Drive files)         │
│                                                               │
│  GET /api/auth/url      → OAuth2 consent URL                 │
│  GET /api/auth/callback → token exchange + cookie            │
│  GET /api/auth/status   → check session                      │
└─────────────────────────────────────────────────────────────┘
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
      Groq API     Google Drive     Google OAuth2
   (Whisper +      API v3          (token exchange)
    Llama 3.3)
```

---

## API Endpoints

| Method | Path                | Description                          |
|--------|---------------------|--------------------------------------|
| GET    | `/api/auth/url`     | Get Google OAuth2 consent URL        |
| GET    | `/api/auth/callback`| OAuth2 callback — exchanges code     |
| GET    | `/api/auth/status`  | Check if authenticated               |
| GET    | `/api/auth/logout`  | Clear session and tokens             |
| POST   | `/api/generate`     | Generate TAD from input              |
| GET    | `/api/health`       | Server health check                  |

### POST /api/generate — Form Fields

| Field         | Type   | Required | Description                          |
|---------------|--------|----------|--------------------------------------|
| `clientName`  | string | No       | Override client name in document     |
| `projectName` | string | No       | Override project name in document    |
| `message`     | string | No*      | Raw text, notes, or transcript       |
| `file`        | file   | No*      | Audio, video, PDF, DOCX, or TXT      |

\* At least one of `message` or `file` is required.

---

## Troubleshooting

**"NOT_AUTHENTICATED" error on generate**
→ Your Google Drive session expired or wasn't set. Click "Connect Google Drive" in the header and re-authenticate.

**"Groq API key not set"**
→ Check that `GROQ_API_KEY` is correctly set in `server/.env` and the server was restarted.

**Audio transcription fails with 413**
→ Audio/video files must be under 25MB for Groq Whisper. Compress or trim your recording.

**Google OAuth redirect error**
→ Ensure `http://localhost:5000/api/auth/callback` is listed in your Google Cloud OAuth client's "Authorized redirect URIs".

**"Drive folder not found" / permission error**
→ Ensure the Google account used in OAuth has access to the `GOOGLE_DRIVE_PARENT_FOLDER_ID` folder.

**CORS errors in browser**
→ Make sure `CLIENT_URL=http://localhost:5173` in server `.env` matches exactly where the frontend runs.

**JSON parse failure from AI**
→ The server retries once with a stricter prompt. If it still fails, the raw AI response is logged — check `server` terminal output.

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, Vite, TailwindCSS                   |
| Backend    | Node.js, Express (ES Modules)                 |
| AI         | Groq SDK — llama-3.3-70b + whisper-large-v3   |
| PDF        | pdf-lib                                       |
| DOCX       | docx (npm)                                    |
| Drive      | googleapis (Drive API v3 + OAuth2)            |
| File Upload| multer (memoryStorage — no disk writes)       |

---

## Security Notes

- OAuth tokens are stored **in server memory** (Map). They are lost on server restart. For production, use Redis or a database.
- The `sid` cookie is `httpOnly` and `sameSite: lax`. Set `secure: true` in production (HTTPS).
- Files never touch disk — all processing is in RAM via Buffer.
- Uploaded Drive files are set to `anyone reader` so download links work without authentication.
