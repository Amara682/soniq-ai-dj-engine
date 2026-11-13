CREATE DATABASE IF NOT EXISTS soniq_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE soniq_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  artist VARCHAR(180) NOT NULL,
  album VARCHAR(180) DEFAULT NULL,
  mood ENUM('chill','focus','energy','happy','sad','romantic') NOT NULL DEFAULT 'chill',
  genre VARCHAR(100) DEFAULT NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 180,
  cover_url VARCHAR(500) DEFAULT NULL,
  audio_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS liked_songs (
  user_id BIGINT UNSIGNED NOT NULL,
  song_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, song_id),
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listening_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  song_id BIGINT UNSIGNED NOT NULL,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  INDEX idx_history_user_played (user_id, played_at)
);

CREATE TABLE IF NOT EXISTS playlists (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_playlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id BIGINT UNSIGNED NOT NULL,
  song_id BIGINT UNSIGNED NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, song_id),
  CONSTRAINT fk_playlist_songs_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_playlist_songs_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

INSERT INTO songs (title, artist, album, mood, genre, duration_seconds, cover_url, audio_url)
SELECT * FROM (
  SELECT 'Midnight Drive', 'Neon Coast', 'After Hours', 'chill', 'Electronic', 214,
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=500',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  UNION ALL SELECT 'Blue Horizon', 'Astra Bloom', 'Open Skies', 'focus', 'Ambient', 196,
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  UNION ALL SELECT 'Electric Pulse', 'Vanta', 'Voltage', 'energy', 'Dance', 205,
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  UNION ALL SELECT 'Golden Hour', 'June Arcade', 'Daylight', 'happy', 'Indie Pop', 188,
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM songs LIMIT 1);
