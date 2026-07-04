# NikahConnect — Full-Stack Halal Matrimonial Platform

A complete full-stack web application: React (Vite) frontend + Node.js/Express backend + MongoDB + Socket.IO for real-time features.

## Features

- **Authentication** — JWT-based register/login/logout, protected routes, **real profile photo required at sign-up** (no cartoon avatars)
- **Browse & filter** — filters apply live as you change them (no "Apply" click needed); filter by sect, country, age, education, marital status; sort by match %, age, or activity
- **Privacy controls** — a dedicated **Privacy settings** page controlling who can see your profile picture and your gallery (Everyone / Connections only / Only me). Photos you're not allowed to see show as a blurred placeholder with a lock icon — never leaked to the browser
- **Show Interest** — send/accept/decline interest requests, tracked on a dashboard
- **Messaging is connection-gated** — you can only message a member once your interest has been mutually accepted, a standard safety expectation for matrimonial platforms
- **Live notifications** — real-time toast + notification bell via Socket.IO (new interest, accepted/declined, new message, profile view)
- **Live chat** — real-time messaging with Socket.IO, typing indicators, read receipts, online/offline presence, working conversation search, emoji picker, image sharing, separate mobile list/chat views
- **Block & report** — block a member (hides you from each other, blocks messaging) or report a profile
- **Dashboard** — profile completion tracker, interests received/sent, recent activity feed
- **Fully responsive** — mobile-first, ready to be wrapped for a mobile app later (see "Going mobile" below)

## Tech stack (free)

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Socket.IO-client, FontAwesome (SVG, bundled — no CDN dependency) |
| Backend | Node.js, Express, Socket.IO |
| Database | **MongoDB** — self-hosted Community Edition for local dev (100% free, no Atlas subscription needed); see "Database" below for production options |
| Photo storage | Local files under `backend/uploads/` (avatars, gallery, chat images) — only the file *path* is stored in MongoDB, never a base64 blob |
| Auth | JSON Web Tokens (jsonwebtoken) + bcryptjs |
| Styling | Plain CSS (grouped stylesheets, CSS custom properties), Google Fonts |

## Database

This uses **real MongoDB**, not a paid service — MongoDB Community Edition is free software you run yourself, same as Postgres or MySQL. There's no cost unless you choose to pay someone else to host it for you (e.g. Atlas's paid tiers). Structured data (users, interests, conversations, messages, notifications, reports) lives in MongoDB collections as normal Mongoose documents; only the actual photo *files* live on disk under `backend/uploads/`, with their public URL path saved on the relevant document (e.g. `user.avatar = "/uploads/avatars/xyz.jpg"`).

**For local development:** install MongoDB Community Edition and run it locally — see below.

**For production:** you have two free-or-cheap options:
1. **MongoDB Atlas free tier ("M0")** — genuinely free forever, 512MB, fully managed by MongoDB Inc, reachable from anywhere (including Render). Easiest option if you don't already have a server.
2. **Self-host on your own VPS** — install MongoDB Community Edition there instead, same as local dev, and point `MONGO_URI` at it.

Either way, only `MONGO_URI` in `.env` changes — no code changes needed.

## Project structure

```
nikahconnect/
  backend/
    src/
      config/        db.js (Mongoose connection)
      models/        User, Interest, Conversation, Message, Notification, Report (Mongoose schemas)
      controllers/   auth, user, interest, message, notification, report
      routes/        auth, user, interest, message, notification, report
      middleware/    auth (JWT), errorHandler
      sockets/       socketHandler (presence), chatSocket (messages+typing), notificationSocket
      utils/         generateToken, validators, privacy, imageStorage, seed
      server.js
    uploads/         avatars/, gallery/, chat/  — real uploaded photo files (git-ignored)
    package.json
    .env
  frontend/
    src/
      components/    auth, browse, dashboard, layout, messages, notifications, profile, shared
      context/        AuthContext, SocketContext, NotificationContext
      hooks/          useAuth, useSocket, useNotifications, useTypingIndicator
      services/       api, authService, userService, interestService, messageService, notificationService
      pages/          HomePage, LoginPage, RegisterPage, BrowsePage, ProfileDetailPage, MessagesPage,
                       DashboardPage, EditProfilePage, PrivacySettingsPage, SavedProfilesPage, ActivityPage
      styles/         shared.css, layout.css, auth.css, browse.css, profile.css, messages.css,
                       dashboard.css, editprofile.css, privacy.css, pages.css, app.css
      utils/          colors, dateHelpers, icons (FontAwesome SVG library registration)
      App.jsx, main.jsx, index.css
    package.json
    .env
```

## Prerequisites (all free)

1. **Node.js** v18+ — https://nodejs.org
2. **MongoDB Community Edition** — https://www.mongodb.com/try/download/community (or use Docker — see below)

## Installing MongoDB locally

**Option A — native install** (Windows/Mac/Linux installers on the link above). Once installed, MongoDB usually starts automatically as a background service. To check, run `mongosh` in a terminal — if it connects, you're set.

**Option B — Docker (simplest, works the same on every OS):**
```bash
docker run -d --name nikahconnect-mongo -p 27017:27017 mongo:7
```
This starts MongoDB in the background on the default port. To stop/start it later: `docker stop nikahconnect-mongo` / `docker start nikahconnect-mongo`.

Either way, the default connection string `mongodb://127.0.0.1:27017/nikahconnect` (already set in `backend/.env`) will work — MongoDB creates the `nikahconnect` database automatically the first time data is written to it.

## Setup

### 1. Backend
```bash
cd backend
npm install
npm run seed        # optional: wipes and re-populates the DB with demo profiles
npm run dev          # starts on http://localhost:5000
```

If you see `MongoDB connection failed`, make sure MongoDB is actually running (`mongosh` should connect) before starting the backend.

Sample seeded login (if you ran `npm run seed`):
- `ahmad@example.com` / `password123`
- `fatima@example.com` / `password123`
- (4 more demo profiles — see `backend/src/utils/seed.js`)

### 2. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # starts on http://localhost:5173
```

Open http://localhost:5173 in two different browsers (or one normal + one incognito window) and log in as two different seeded users to test live chat, typing indicators, and live notifications in real time. To test messaging, first send + accept an interest between the two accounts — messaging only unlocks after that (see "Messaging is connection-gated" above).

## Building for production

```bash
cd frontend && npm run build     # outputs static files to frontend/dist
cd backend && npm start          # run the API + Socket.IO server
```

Serve `frontend/dist` with any static host (Nginx, Caddy, or `serve -s dist`) and point `VITE_API_URL` / `VITE_SOCKET_URL` at your backend's public address. Make sure `MONGO_URI` points at your production database (Atlas or your own server — see "Database" above) and `backend/uploads/` is on a real, persistent disk.

## Free deployment for a client demo (Render + Netlify + Atlas)

This deploys the backend to **Render** (free tier, supports WebSockets/Socket.IO), the database to **MongoDB Atlas** (free M0 tier), and the frontend to **Netlify** (free tier, static hosting). Total cost: $0 for a demo.

### 1. Create a free MongoDB Atlas cluster

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free, no card required for the M0 tier)
2. Create a free **M0** cluster (512MB — plenty for a demo/early production)
3. Under **Database Access**, create a database user with a password
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) so Render can reach it
5. Click **Connect** → **Drivers** → copy the connection string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/nikahconnect?retryWrites=true&w=majority`
   (fill in your real username/password, and add `/nikahconnect` as the database name if it's not already there)

### 2. Push this repo to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 3. Deploy the backend on Render

1. Go to https://render.com and sign up (free, no card required)
2. Click **New +** → **Web Service** → connect your GitHub repo
3. Render will detect `render.yaml` automatically and pre-fill settings. If not, set manually:
   - **Root directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
4. Under **Environment**, add these variables:
   | Key | Value |
   |---|---|
   | `MONGO_URI` | Your Atlas connection string from step 1 |
   | `JWT_SECRET` | Any long random string (Render can auto-generate this) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | Leave blank for now — fill in after step 4 (your Netlify URL) |
5. Click **Create Web Service**. Render builds and deploys; you'll get a URL like `https://nikahconnect-backend.onrender.com`
6. Test it: visit `https://nikahconnect-backend.onrender.com/api/health` — you should see `{"status":"ok","storage":"mongodb",...}`

> Free tier note: Render's free web services spin down after 15 minutes of inactivity and take ~30–60 seconds to wake up on the next request. Fine for a demo; mention this to your client if the first load is slow.

### 4. Deploy the frontend on Netlify

1. Go to https://netlify.com and sign up (free)
2. Click **Add new site** → **Import an existing project** → connect the same GitHub repo
3. Netlify will detect `netlify.toml` automatically. If not, set manually:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Under **Site settings → Environment variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://nikahconnect-backend.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://nikahconnect-backend.onrender.com` |
5. Click **Deploy site**. You'll get a URL like `https://your-app-name.netlify.app`

### 5. Connect the two: update CLIENT_URL on Render

1. Go back to your Render service → **Environment**
2. Set `CLIENT_URL` to your Netlify URL, e.g. `https://your-app-name.netlify.app`
3. Save — Render will redeploy automatically with the new CORS setting

### 6. Seed demo data (optional)

From Render, open the **Shell** tab on your backend service and run:
```bash
npm run seed
```
This populates sample users so your client can log in immediately (`ahmad@example.com` / `password123`, etc.) instead of registering from scratch.

### 7. Test it

Open your Netlify URL in two different browsers (or one normal + one incognito), log in as two different seeded users, send + accept an interest, and confirm live chat, typing indicators, and live notifications all work across the two sessions.

### Troubleshooting

- **CORS errors in browser console** → double check `CLIENT_URL` on Render exactly matches your Netlify URL (no trailing slash).
- **Socket.IO not connecting** → confirm `VITE_SOCKET_URL` on Netlify has no `/api` suffix (it should be just the bare Render URL).
- **404 on page refresh** (e.g. refreshing `/browse`) → make sure `netlify.toml`'s redirect rule deployed; it's included in this repo already.
- **Backend won't start / MongoDB connection failed** → double check the Atlas connection string, that your Atlas database user's password doesn't contain unescaped special characters, and that Network Access allows `0.0.0.0/0`.

## Going mobile

The frontend is already fully responsive (mobile browse/filters, dedicated mobile chat flow, mobile nav). When you're ready to wrap this as a native/hybrid mobile app, the cleanest path with this codebase is:
- Reuse the backend as-is (it's a plain REST + Socket.IO API, framework-agnostic on the client side).
- Build a React Native (Expo) app that talks to the same `/api` endpoints and Socket.IO server — most of the `services/` layer in `frontend/src` can be reused almost as-is, since it's just Axios calls.
- Alternatively, ship the existing responsive web app inside a WebView-based wrapper (Capacitor) as a faster first step, then move to a fully native UI later.

## Security notes for production

- `backend/.env`'s `JWT_SECRET` is a placeholder — set a real, long random value before going live, and never commit `.env` to git (already git-ignored).
- The original version of this project had a MongoDB Atlas connection string (with a real password) committed directly in `backend/.env`. That's been removed — if that string was ever pushed to a public repo, **rotate that database password**. Whatever `MONGO_URI` you use going forward, keep it in `.env` only, never in code.
- Uploaded images are size- and type-validated server-side (max 6MB, JPG/PNG/WEBP/GIF only) before being written to disk.
