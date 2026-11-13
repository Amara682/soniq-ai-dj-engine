# SONIQ QA and Change Log

## Recent application updates
- Added a dedicated global search-results view; search matches title, artist, album and mood without the selected mood filter hiding matches.
- Added Settings navigation and a profile display-name editor connected to `PATCH /api/me`.
- Added playlist rename/edit and delete controls connected to the authenticated playlist endpoints.
- Added shuffle and repeat-off/repeat-all/repeat-one controls to the player and Settings view.
- Improved previous-track behavior (restart current track when playback is beyond three seconds; otherwise move to previous track).
- Updated playlist song counts after removing tracks.
- Added `.gitignore` and replaced the example JWT secret with a placeholder that must be changed.
- Expanded setup, API and deployment-scope documentation.

## Static checks completed
- Backend route file passed `node --check`.
- Project source and schema were inspected before editing.

## Checks not completed in this environment
- Frontend production build was not completed because dependency installation did not finish within the available execution window; `vite` was unavailable afterward.
- No live MySQL integration test was run.
- No browser end-to-end test was run for authentication, playlist mutations, profile updates or audio playback.
- External sample audio URLs and image hosts were not availability-tested.

## Manual QA checklist
1. Import `database/schema.sql` into a clean MySQL database.
2. Configure a private `backend/.env` and start backend; verify `/api/health` reports database connected.
3. Register a new account, sign out and sign in again.
4. Search a title, artist, album and mood; clear search and confirm mood browsing returns.
5. Like/unlike tracks; verify guest persistence and signed-in MySQL persistence.
6. Create playlist, add tracks, rename/edit it, remove a track and delete the playlist.
7. Update profile name and verify it remains after re-login.
8. Test previous, next, shuffle, repeat modes, seek, mute/volume and end-of-track behavior with permitted audio files.
9. Verify Recently Played after multiple track selections.
10. Run `npm ci && npm run build` in `frontend`; fix any build warnings/errors.
11. Test desktop and mobile viewport sizes and capture evidence screenshots/video.
12. Review security settings before deploying; never upload `.env` or credentials to GitHub.

## Honest project status
This is an enhanced development build, not a verified production release. Do not claim every feature passed QA until the manual and automated checks above have actually been completed.
