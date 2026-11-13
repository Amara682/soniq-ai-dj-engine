import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { requireAuth } from './middleware/auth.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', app: 'SONIQ API' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: 'Check MySQL settings in backend/.env' });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
if (
  name.length < 2 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  password.length < 8
) {
  return res.status(400).json({
    message: 'Enter a name, valid email, and password with at least 8 characters.'
  });
}
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hash]);
    const user = { id: result.insertId, name, email };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create account.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const [rows] = await pool.execute('SELECT id, name, email, password_hash FROM users WHERE email = ?', [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not sign in.' });
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));


// Update the authenticated user's display name.
router.patch('/me', requireAuth, async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' });
  }
  try {
    await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    res.json({ user: { ...req.user, name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update profile.' });
  }
});

router.get('/songs', async (req, res) => {
  try {
    const search = `%${String(req.query.search || '').trim()}%`;
    const mood = String(req.query.mood || '').trim().toLowerCase();
    let sql = 'SELECT id, title, artist, album, mood, genre, duration_seconds, cover_url, audio_url FROM songs WHERE (title LIKE ? OR artist LIKE ? OR album LIKE ?)';
    const params = [search, search, search];
    const allowed = ['chill', 'focus', 'energy', 'happy', 'sad', 'romantic'];
    if (allowed.includes(mood)) { sql += ' AND mood = ?'; params.push(mood); }
    sql += ' ORDER BY id DESC LIMIT 100';
    const [songs] = await pool.execute(sql, params);
    res.json({ songs });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load songs. Is MySQL configured?' }); }
});

router.get('/recommendations', async (req, res) => {
  const allowed = ['chill', 'focus', 'energy', 'happy', 'sad', 'romantic'];
  const mood = allowed.includes(String(req.query.mood || '').toLowerCase()) ? String(req.query.mood).toLowerCase() : 'chill';
  try {
    const [songs] = await pool.execute(
      'SELECT id, title, artist, album, mood, genre, duration_seconds, cover_url, audio_url FROM songs WHERE mood = ? ORDER BY RAND() LIMIT 8', [mood]
    );
    res.json({ mood, recommendations: songs });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load recommendations.' }); }
});

router.get('/likes', requireAuth, async (req, res) => {
  try {
    const [songs] = await pool.execute(
      'SELECT s.id, s.title, s.artist, s.album, s.mood, s.genre, s.duration_seconds, s.cover_url, s.audio_url FROM liked_songs l JOIN songs s ON s.id=l.song_id WHERE l.user_id=? ORDER BY l.created_at DESC', [req.user.id]
    );
    res.json({ songs });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load likes.' }); }
});
router.post('/likes/:songId', requireAuth, async (req, res) => {
  try {
    await pool.execute('INSERT IGNORE INTO liked_songs (user_id, song_id) VALUES (?, ?)', [req.user.id, req.params.songId]);
    res.status(201).json({ liked: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not like song.' }); }
});
router.delete('/likes/:songId', requireAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM liked_songs WHERE user_id=? AND song_id=?', [req.user.id, req.params.songId]);
    res.json({ liked: false });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not unlike song.' }); }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const [songs] = await pool.execute(
      'SELECT h.id AS history_id, h.played_at, s.id, s.title, s.artist, s.album, s.mood, s.genre, s.duration_seconds, s.cover_url, s.audio_url FROM listening_history h JOIN songs s ON s.id=h.song_id WHERE h.user_id=? ORDER BY h.played_at DESC LIMIT 50', [req.user.id]
    );
    res.json({ history: songs });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load listening history.' }); }
});
router.post('/history/:songId', requireAuth, async (req, res) => {
  try {
    await pool.execute('INSERT INTO listening_history (user_id, song_id) VALUES (?, ?)', [req.user.id, req.params.songId]);
    res.status(201).json({ saved: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not save listening history.' }); }
});

router.get('/playlists', requireAuth, async (req, res) => {
  try {
    const [playlists] = await pool.execute(
      'SELECT p.id, p.name, p.description, p.created_at, COUNT(ps.song_id) AS song_count FROM playlists p LEFT JOIN playlist_songs ps ON ps.playlist_id=p.id WHERE p.user_id=? GROUP BY p.id ORDER BY p.created_at DESC', [req.user.id]
    );
    res.json({ playlists });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load playlists.' }); }
});
router.post('/playlists', requireAuth, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  if (name.length < 1 || name.length > 150) return res.status(400).json({ message: 'Playlist name is required (max 150 characters).' });
  try {
    const [result] = await pool.execute('INSERT INTO playlists (user_id, name, description) VALUES (?, ?, ?)', [req.user.id, name, description || null]);
    res.status(201).json({ playlist: { id: result.insertId, name, description } });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not create playlist.' }); }
});


// Rename or update a playlist owned by the authenticated user.
router.patch('/playlists/:playlistId', requireAuth, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  if (!name || name.length > 150) return res.status(400).json({ message: 'Playlist name is required (max 150 characters).' });
  try {
    const [result] = await pool.execute(
      'UPDATE playlists SET name = ?, description = ? WHERE id = ? AND user_id = ?',
      [name, description || null, req.params.playlistId, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Playlist not found.' });
    res.json({ playlist: { id: Number(req.params.playlistId), name, description } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update playlist.' });
  }
});

// Delete a playlist owned by the authenticated user.
router.delete('/playlists/:playlistId', requireAuth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM playlists WHERE id = ? AND user_id = ?',
      [req.params.playlistId, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Playlist not found.' });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete playlist.' });
  }
});

router.get('/playlists/:playlistId/songs', requireAuth, async (req, res) => {
  try {
    const [owned] = await pool.execute('SELECT id FROM playlists WHERE id=? AND user_id=?', [req.params.playlistId, req.user.id]);
    if (!owned.length) return res.status(404).json({ message: 'Playlist not found.' });
    const [songs] = await pool.execute('SELECT s.id, s.title, s.artist, s.album, s.mood, s.genre, s.duration_seconds, s.cover_url, s.audio_url FROM playlist_songs ps JOIN songs s ON s.id=ps.song_id WHERE ps.playlist_id=? ORDER BY ps.position, s.title', [req.params.playlistId]);
    res.json({ songs });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load playlist tracks.' }); }
});
router.post('/playlists/:playlistId/songs', requireAuth, async (req, res) => {
  const songId = Number(req.body.songId);
  if (!Number.isInteger(songId) || songId < 1) return res.status(400).json({ message: 'A valid song is required.' });
  try {
    const [owned] = await pool.execute('SELECT id FROM playlists WHERE id=? AND user_id=?', [req.params.playlistId, req.user.id]);
    if (!owned.length) return res.status(404).json({ message: 'Playlist not found.' });
    await pool.execute('INSERT IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)', [req.params.playlistId, songId]);
    const [songs] = await pool.execute('SELECT s.id, s.title, s.artist, s.album, s.mood, s.genre, s.duration_seconds, s.cover_url, s.audio_url FROM playlist_songs ps JOIN songs s ON s.id=ps.song_id WHERE ps.playlist_id=? ORDER BY ps.position, s.title', [req.params.playlistId]);
    res.status(201).json({ songs });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not add track to playlist.' }); }
});
router.delete('/playlists/:playlistId/songs/:songId', requireAuth, async (req, res) => {
  try {
    const [owned] = await pool.execute('SELECT id FROM playlists WHERE id=? AND user_id=?', [req.params.playlistId, req.user.id]);
    if (!owned.length) return res.status(404).json({ message: 'Playlist not found.' });
    await pool.execute('DELETE FROM playlist_songs WHERE playlist_id=? AND song_id=?', [req.params.playlistId, req.params.songId]);
    res.json({ removed: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not remove track.' }); }
});

export default router;
