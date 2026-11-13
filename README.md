# SONIQ AI DJ Engine

A full-stack music discovery and playback application built with React, Vite, Express, Node.js and MySQL. The application includes profile management, playlist management, global search results and playback modes while preserving the existing SONIQ dark/neon visual identity.

## Features

### Music experience
- Discover tracks and filter by mood.
- Global search across track title, artist, album and mood.
- Mood-based recommendation endpoint (rule-based baseline; not a trained ML model).
- Audio playback, play/pause, previous/next, seek and volume.
- Shuffle and repeat modes.
- Up-next queue, liked songs and recently played history.

### Account and library
- Registration and login using bcrypt password hashing and JWT authentication.
- MySQL-backed likes, listening history and playlists for signed-in users.
- Guest likes stored in browser local storage.
- Create, rename, edit and delete playlists; add/remove tracks.
- Update the signed-in user's display name.

## Technology stack
- Frontend: React 18, Vite, lucide-react
- Backend: Node.js, Express
- Database: MySQL 8+
- Authentication: JSON Web Tokens and bcryptjs

## Requirements
- Node.js 18 or later (Node 20 LTS recommended)
- npm
- MySQL 8 or later

## Local setup

1. Create/import the database by executing `database/schema.sql` in MySQL Workbench. This creates `soniq_db` and seeds four demo tracks if the songs table is empty.
2. Open a terminal in `backend` and copy `.env.example` to `.env`:
   - PowerShell: `Copy-Item .env.example .env`
   - Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` to your local MySQL values.
   - Replace `JWT_SECRET` with a unique random secret. Never commit or share `.env`.
3. Install and start backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   API: `http://localhost:5000`; health check: `http://localhost:5000/api/health`.
4. In a second terminal install and start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open `http://localhost:5173`.

## API overview

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/api/health` | No | API and DB health |
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/me` | Yes | Current user |
| PATCH | `/api/me` | Yes | Update display name |
| GET | `/api/songs` | No | Search/filter song catalog |
| GET | `/api/recommendations?mood=chill` | No | Mood-based recommendations |
| GET/POST/DELETE | `/api/likes` and `/api/likes/:songId` | Yes | Liked songs |
| GET/POST | `/api/history` and `/api/history/:songId` | Yes | Listening history |
| GET/POST | `/api/playlists` | Yes | List/create playlists |
| PATCH/DELETE | `/api/playlists/:playlistId` | Yes | Edit/delete owned playlist |
| GET/POST | `/api/playlists/:playlistId/songs` | Yes | Read/add playlist tracks |
| DELETE | `/api/playlists/:playlistId/songs/:songId` | Yes | Remove playlist track |

For authenticated endpoints send `Authorization: Bearer <token>`.

## Important scope notes
- Recommendations are currently a rule-based mood filter with random ordering. Do not describe this as a trained AI/ML model in a presentation. A genuine ML recommendation model is a separate future milestone and should include a dataset, training/evaluation and metrics.
- Demo audio URLs are sample URLs. For a public deployment, use audio you own or have permission to stream and confirm the provider's hosting/CORS terms.
- This repository does not include payment, commercial streaming licenses, DRM, offline downloads, or a production-scale content delivery network.

## Before deployment
- Configure production environment variables and a strong JWT secret.
- Restrict CORS to the deployed frontend origin; use HTTPS.
- Use a managed MySQL instance, backups and least-privilege database credentials.
- Replace demo audio and cover URLs with authorized assets.
- Run frontend production build and full browser/API/database tests against the target environment.
