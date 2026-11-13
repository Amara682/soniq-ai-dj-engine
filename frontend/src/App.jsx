import { useEffect, useMemo, useRef, useState } from 'react';
import { Home, Compass, AudioLines, Library, Heart, Search, Bell, Play, Pause, SkipBack, SkipForward, Volume2, Plus, Music2, Headphones, Zap, Moon, Sun, Waves, Disc3, LogIn, LogOut, X, ListMusic, Clock3, Trash2, ArrowLeft } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const moods = [
  { id: 'chill', label: 'Chill', icon: Moon, color: '#55d6ff' },
  { id: 'focus', label: 'Focus', icon: AudioLines, color: '#9b8cff' },
  { id: 'energy', label: 'Energy', icon: Zap, color: '#b8ff4d' },
  { id: 'happy', label: 'Happy', icon: Sun, color: '#ffbf69' },
  { id: 'sad', label: 'Melancholy', icon: Waves, color: '#7b9dff' },
  { id: 'romantic', label: 'Romantic', icon: Heart, color: '#ff7fbd' }
];
const demoSongs = [
  { id: 1, title: 'Midnight Drive', artist: 'Neon Coast', mood: 'chill', duration_seconds: 214, cover_url: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=500', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Blue Horizon', artist: 'Astra Bloom', mood: 'focus', duration_seconds: 196, cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Electric Pulse', artist: 'Vanta', mood: 'energy', duration_seconds: 205, cover_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Golden Hour', artist: 'June Arcade', mood: 'happy', duration_seconds: 188, cover_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

function Vinyl() {
  return <div className="vinyl-stage"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="vinyl"><div className="groove g1"></div><div className="groove g2"></div><div className="groove g3"></div><div className="label"><span>SONIQ</span><small>AI DJ ENGINE</small></div></div><div className="tonearm"><div className="tone-head"></div></div><div className="glow"></div></div>;
}
function Cover({ song, size = '' }) {
  return <div className={`cover ${size}`} style={{ backgroundImage: `linear-gradient(145deg, #0c1828aa, #07101855), url("${song.cover_url || ''}")` }}><Music2 size={22} /></div>;
}
function TrackCollection({ songs, onPlay, onLike, likes, formatTime, title, empty, onRemove }) {
  return <section className="section-block tracks-section"><div className="section-heading"><div><span className="section-kicker">YOUR MUSIC</span><h2>{title}<em>.</em></h2></div><span className="track-count">{songs.length} TRACKS</span></div><div className="track-grid">{songs.map((song,i)=><article className="track-card" key={`${song.id}-${i}`}><div className="track-cover-wrap"><Cover song={song}/><button className="cover-play" onClick={()=>onPlay(song)}><Play size={17} fill="currentColor"/></button><span className="track-index">{String(i+1).padStart(2,'0')}</span></div><div className="track-details"><div><b>{song.title}</b><small>{song.artist}</small></div><button className={`like-btn ${likes.some(s=>s.id===song.id)?'liked':''}`} onClick={()=>onLike(song)}><Heart size={17} fill={likes.some(s=>s.id===song.id)?'currentColor':'none'}/></button></div><div className="track-foot"><span>{song.mood}</span><span>{formatTime(song.duration_seconds)}</span></div>{onRemove && <button className="remove-track" onClick={()=>onRemove(song)}><Trash2 size={13}/> Remove</button>}</article>)}</div>{!songs.length&&<div className="empty-state">{empty || 'No tracks available yet.'}</div>}</section>;
}

function App() {
  const [songs, setSongs] = useState(demoSongs);
  const [mood, setMood] = useState('chill');
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState(demoSongs[0]);
  const [playing, setPlaying] = useState(false);
  const [queue, setQueue] = useState(demoSongs.slice(1));
  const [token, setToken] = useState(localStorage.getItem('soniq_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('soniq_user') || 'null'));
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [likes, setLikes] = useState(() => { try { return JSON.parse(localStorage.getItem('soniq_guest_likes') || '[]'); } catch { return []; } });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [activePage, setActivePage] = useState('overview');
  const [history, setHistory] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [profileName, setProfileName] = useState('');

  const audioRef = useRef(null);
  const audioSourceRef = useRef('');

  useEffect(() => {
    fetch(`${API}/songs`).then(r => r.ok ? r.json() : Promise.reject()).then(d => { if (d.songs?.length) { setSongs(d.songs); setCurrent(d.songs[0]); setQueue(d.songs.slice(1)); } }).catch(() => setNotice('Demo mode — start the backend and MySQL to sync your library.'));
  }, []);
  useEffect(() => {
    if (!token) { localStorage.setItem('soniq_guest_likes', JSON.stringify(likes)); return; }
    fetch(`${API}/likes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Could not load liked songs.')))
      .then(d => setLikes(d.songs || []))
      .catch(err => setNotice(err.message || 'Could not load liked songs.'));
  }, [token]);
  useEffect(() => {
    if (!token) localStorage.setItem('soniq_guest_likes', JSON.stringify(likes));
  }, [likes, token]);
  // Load a newly selected track once. Playback itself is started from the
  // user's click handler so browsers can honour the user-gesture permission.
  useEffect(() => {
    const audio = audioRef.current;
    const audioUrl = current?.audio_url;
    if (!audio || !audioUrl || audioSourceRef.current === audioUrl) return;

    audio.pause();
    audio.src = audioUrl;
    audioSourceRef.current = audioUrl;
    audio.load();
    setCurrentTime(0);
    setDuration(Number(current?.duration_seconds) || 0);
  }, [current?.audio_url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return songs.filter(s => { const matchesMood = query ? true : (mood === 'all' || s.mood === mood); const searchable = `${s.title || ''} ${s.artist || ''} ${s.album || ''} ${s.mood || ''}`.toLowerCase(); return matchesMood && (!query || searchable.includes(query)); }); }, [songs, mood, search]);
  const authHeaders = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  const navigate = page => { setActivePage(page); setSelectedPlaylist(null); setSearch(''); };
  const loadLibrary = async () => {
    if (!token) { setAuthMode('login'); setAuthOpen(true); setNotice('Sign in to access your personal library.'); return; }
    try {
      const [p, h] = await Promise.all([fetch(`${API}/playlists`, { headers: authHeaders() }), fetch(`${API}/history`, { headers: authHeaders() })]);
      if (p.ok) setPlaylists((await p.json()).playlists || []);
      if (h.ok) setHistory((await h.json()).history || []);
    } catch { setNotice('Could not load your library. Check the backend connection.'); }
  };
  const loadRecommendations = async selectedMood => {
    try { const res = await fetch(`${API}/recommendations?mood=${encodeURIComponent(selectedMood || mood)}`); const data = await res.json(); if (res.ok) setRecommendations(data.recommendations || []); else setRecommendations(songs.filter(song => song.mood === (selectedMood || mood))); }
    catch { setRecommendations(songs.filter(song => song.mood === (selectedMood || mood))); }
  };
  useEffect(() => { if (activePage === 'library' || activePage === 'history') loadLibrary(); if (activePage === 'mixes') loadRecommendations(mood); }, [activePage, token]);
  const createPlaylist = async e => {
    e.preventDefault();
    if (!token) { setAuthOpen(true); setNotice('Sign in to create playlists.'); return; }
    try { const res = await fetch(`${API}/playlists`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: playlistName, description: playlistDescription }) }); const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Could not create playlist.'); setPlaylists(prev => [{ ...data.playlist, song_count: 0 }, ...prev]); setPlaylistName(''); setPlaylistDescription(''); setShowPlaylistForm(false); setNotice('Playlist created successfully.'); }
    catch (err) { setNotice(err.message); }
  };
  const openPlaylist = async playlist => {
    setSelectedPlaylist(playlist);
    try { const res = await fetch(`${API}/playlists/${playlist.id}/songs`, { headers: authHeaders() }); const data = await res.json(); if (res.ok) setPlaylistSongs(data.songs || []); else setPlaylistSongs([]); } catch { setPlaylistSongs([]); }
  };
  const addToPlaylist = async (playlist, song) => {
    try { const res = await fetch(`${API}/playlists/${playlist.id}/songs`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ songId: song.id }) }); const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Could not add track.'); if (selectedPlaylist?.id === playlist.id) setPlaylistSongs(data.songs || [...playlistSongs, song]); setPlaylists(prev => prev.map(p => p.id === playlist.id ? { ...p, song_count: Number(p.song_count || 0) + 1 } : p)); setNotice('Track added to playlist.'); } catch (err) { setNotice(err.message); }
  };
  const removeFromPlaylist = async song => {
    try { const res = await fetch(`${API}/playlists/${selectedPlaylist.id}/songs/${song.id}`, { method: 'DELETE', headers: authHeaders() }); if (res.ok) { setPlaylistSongs(prev => prev.filter(item => item.id !== song.id)); setPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? { ...p, song_count: Math.max(0, Number(p.song_count || 0) - 1) } : p)); setNotice('Track removed from playlist.'); } } catch { setNotice('Could not remove track.'); }
  };
  const updateProfile = async e => {
    e.preventDefault();
    if (!token) { setAuthOpen(true); return; }
    try {
      const res = await fetch(`${API}/me`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ name: profileName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not update profile.');
      const updated = { ...user, ...data.user };
      setUser(updated); localStorage.setItem('soniq_user', JSON.stringify(updated));
      setNotice('Profile updated successfully.');
    } catch (err) { setNotice(err.message); }
  };
  const editPlaylist = async playlist => {
    const name = window.prompt('Enter playlist name', playlist.name);
    if (name === null) return;
    const description = window.prompt('Enter playlist description', playlist.description || '');
    if (description === null) return;
    try {
      const res = await fetch(`${API}/playlists/${playlist.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ name, description }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Could not update playlist.');
      setPlaylists(prev => prev.map(item => item.id === playlist.id ? { ...item, ...data.playlist } : item));
      if (selectedPlaylist?.id === playlist.id) setSelectedPlaylist(item => ({ ...item, ...data.playlist }));
      setNotice('Playlist updated.');
    } catch (err) { setNotice(err.message); }
  };
  const deletePlaylist = async playlist => {
    if (!window.confirm(`Delete playlist “${playlist.name}”? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/playlists/${playlist.id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Could not delete playlist.');
      setPlaylists(prev => prev.filter(item => item.id !== playlist.id));
      if (selectedPlaylist?.id === playlist.id) { setSelectedPlaylist(null); setPlaylistSongs([]); }
      setNotice('Playlist deleted.');
    } catch (err) { setNotice(err.message); }
  };
  const previousSong = () => {
    if (audioRef.current?.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    const list = songs; const idx = list.findIndex(s => Number(s.id) === Number(current?.id));
    if (list.length) chooseSong(list[(idx - 1 + list.length) % list.length]);
  };
  const chooseSong = song => {
    if (!song) return;

    setCurrent(song);
    setCurrentTime(0);
    setDuration(Number(song.duration_seconds) || 0);
    setNotice('');

    const audio = audioRef.current;
    if (audio && song.audio_url) {
      if (audioSourceRef.current !== song.audio_url) {
        audio.pause();
        audio.src = song.audio_url;
        audioSourceRef.current = song.audio_url;
        audio.load();
      }

      // Calling play() directly from the click path avoids browser autoplay blocks.
      const playRequest = audio.play();
      if (playRequest && typeof playRequest.then === 'function') {
        playRequest
          .then(() => setPlaying(true))
          .catch(error => {
            console.error('SONIQ audio playback failed:', error);
            setPlaying(false);
            setNotice('This track could not be played. Please try another track.');
          });
      } else {
        setPlaying(true);
      }
    } else {
      setPlaying(false);
      setNotice('This track does not have an audio file yet.');
    }

    if (token) fetch(`${API}/history/${song.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setQueue(q => q.filter(s => Number(s.id) !== Number(song.id)));
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !current?.audio_url) return;

    if (audio.paused) {
      if (audioSourceRef.current !== current.audio_url) {
        audio.src = current.audio_url;
        audioSourceRef.current = current.audio_url;
        audio.load();
      }
      const playRequest = audio.play();
      if (playRequest && typeof playRequest.then === 'function') {
        playRequest
          .then(() => setPlaying(true))
          .catch(error => {
            console.error('SONIQ audio playback failed:', error);
            setPlaying(false);
            setNotice('This track could not be played. Please try another track.');
          });
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  };
  const toggleLike = async song => {
    const exists = likes.some(s => Number(s.id) === Number(song.id));
    // Guests can save likes locally; signed-in users sync likes to MySQL.
    if (!token) {
      setLikes(prev => {
        const next = exists ? prev.filter(s => Number(s.id) !== Number(song.id)) : [...prev, song];
        localStorage.setItem('soniq_guest_likes', JSON.stringify(next));
        return next;
      });
      setNotice(exists ? 'Removed from Liked Songs.' : 'Added to Liked Songs.');
      return;
    }
    try {
      const res = await fetch(`${API}/likes/${song.id}`, { method: exists ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update liked songs.');
      setLikes(prev => exists ? prev.filter(s => Number(s.id) !== Number(song.id)) : [...prev, song]);
      setNotice(exists ? 'Removed from Liked Songs.' : 'Added to Liked Songs.');
    } catch (err) {
      setNotice(err.message || 'Could not update liked songs.');
    }
  };
  const authenticate = async e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const res = await fetch(`${API}/auth/${authMode === 'login' ? 'login' : 'register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');
      localStorage.setItem('soniq_token', data.token); localStorage.setItem('soniq_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setAuthOpen(false); setNotice(`Welcome ${data.user.name || data.user.email}`);
    } catch (err) { setNotice(err.message || 'Could not connect to backend.'); }
  };
const nextSong = () => {
  const list = songs;
  if (!list.length) return;

  const currentIndex = list.findIndex(
    s => Number(s.id) === Number(current?.id)
  );

  let candidate;

  if (shuffle && list.length > 1) {
    const availableSongs = list.filter(
      s => Number(s.id) !== Number(current?.id)
    );

    candidate = availableSongs[
      Math.floor(Math.random() * availableSongs.length)
    ];
  } else {
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + 1) % list.length;

    candidate = list[nextIndex];
  }

  if (candidate) chooseSong(candidate);
};
  const formatTime = n => `${Math.floor((n || 0) / 60)}:${String((n || 0) % 60).padStart(2, '0')}`;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><AudioLines size={23}/></div><div><b>SONIQ</b><span>AI DJ ENGINE</span></div></div>
      <div className="side-label">MENU</div>
      <nav><button className={`nav-item ${activePage==='overview'?'active':''}`} onClick={() => navigate('overview')}><Home size={18}/> Overview</button><button className={`nav-item ${activePage==='discover'?'active':''}`} onClick={() => { setMood('all'); navigate('discover'); }}><Compass size={18}/> Discover</button><button className={`nav-item ${activePage==='mixes'?'active':''}`} onClick={() => navigate('mixes')}><AudioLines size={18}/> AI Mixes <i>NEW</i></button><button className={`nav-item ${activePage==='library'?'active':''}`} onClick={() => { navigate('library'); if (token) loadLibrary(); else setAuthOpen(true); }}><Library size={18}/> Your Library</button><button className={`nav-item ${activePage==='liked'?'active':''}`} onClick={() => navigate('liked')}><Heart size={18}/> Liked Songs</button><button className={`nav-item ${activePage==='history'?'active':''}`} onClick={() => navigate('history')}><Clock3 size={18}/> Recently Played</button><button className={`nav-item ${activePage==='settings'?'active':''}`} onClick={() => { setProfileName(user?.name || ''); navigate('settings'); }}><AudioLines size={18}/> Settings</button></nav>
      <div className="side-label mood-label">YOUR VIBE</div>
      <div className="side-moods">{moods.slice(0,4).map(m => <button key={m.id} className={`mood-link ${mood === m.id ? 'selected' : ''}`} onClick={() => setMood(m.id)}><span style={{ background: m.color }}></span>{m.label}</button>)}</div>
      <div className="sidebar-bottom"><div className="upgrade-icon"><Headphones size={20}/></div><b>Find your frequency.</b><p>Your next favorite sound is one mood away.</p><button onClick={() => setMood('energy')}>Explore mixes <span>↗</span></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>{activePage === 'search' ? 'Search results' : activePage.charAt(0).toUpperCase()+activePage.slice(1)}</b></div><label className="search-box"><Search size={17}/><input value={search} onChange={e => { setSearch(e.target.value); setActivePage(e.target.value.trim() ? 'search' : 'overview'); }} placeholder="Search tracks, artists, moods..." aria-label="Search tracks, artists, albums, and moods"/>{search && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setSearch(''); setActivePage('overview'); }}><X size={14}/></button>}<kbd>⌘ K</kbd></label><div className="top-actions"><button className="icon-btn" title="Notifications" onClick={() => setNotice('You are all caught up.')}><Bell size={18}/></button>{user ? <button className="profile" onClick={() => { localStorage.removeItem('soniq_token'); localStorage.removeItem('soniq_user'); setToken(''); setUser(null); setLikes(JSON.parse(localStorage.getItem('soniq_guest_likes') || '[]')); setNotice('Signed out.'); }}><span>{(user.name || user.email || 'U').slice(0,1).toUpperCase()}</span>{user.name || 'Account'} <LogOut size={15}/></button> : <button className="sign-in" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}><LogIn size={16}/> Sign in</button>}</div></header>
      {activePage === 'overview' && <><section className="welcome"><div><div className="eyebrow"><span className="live-dot"></span> YOUR PERSONAL SOUNDSPACE</div><h1>Feel the <em>frequency.</em></h1><p>A little less noise. A lot more you. Let your mood set the mix.</p></div><div className="date-chip"><span className="equalizer"><i></i><i></i><i></i><i></i></span> AI DJ <b>READY</b></div></section>
      <section className="hero-grid">
        <div className="hero-card"><div className="hero-copy"><div className="pill"><span></span> TODAY'S FEATURED MIX</div><h2>Into the<br/><em>afterglow.</em></h2><p>Deep focus, soft edges, and sounds that keep you in your zone.</p><button className="primary-btn" onClick={() => chooseSong(songs.find(s => s.mood === 'chill') || songs[0])}><Play size={16} fill="currentColor"/> Play the mix <span>↗</span></button><div className="track-meta"><div className="mini-avatars"><span>✦</span><span>♫</span><span>◉</span></div><span>Curated for your current vibe</span></div></div><Vinyl/><div className="hero-wave"></div></div>
        <div className="side-feature"><div className="feature-head"><span>YOUR SOUND DNA</span><span className="tiny-badge">BETA</span></div><div className="sound-score"><div className="score-ring"><span>87</span><small>VIBE</small></div><div><b>In your element</b><p>Your sound leans toward atmospheric and melodic.</p></div></div><div className="dna-bars">{[['Atmospheric',82],['Electronic',67],['Melodic',74]].map(([l,v])=><div key={l}><div><span>{l}</span><b>{v}%</b></div><i><span style={{width:`${v}%`}}></span></i></div>)}</div><div className="feature-foot"><span className="live-dot"></span> Updated from your listening patterns</div></div>
      </section>
      <section className="section-block"><div className="section-heading"><div><span className="section-kicker">TUNED TO YOU</span><h2>Pick your <em>mood.</em></h2></div><button className="text-btn" onClick={() => setMood('all')}>View all moods <span>↗</span></button></div><div className="mood-grid">{moods.map(m=>{const Icon=m.icon;return <button key={m.id} className={`mood-card ${mood===m.id?'chosen':''}`} onClick={()=>setMood(m.id)} style={{'--mood-color':m.color}}><span className="mood-icon"><Icon size={20}/></span><b>{m.label}</b><small>{m.id==='chill'?'Slow it down':m.id==='focus'?'Lock in':m.id==='energy'?'Turn it up':m.id==='happy'?'Feel good':m.id==='sad'?'Sit with it':'Soft feelings'}</small><span className="mood-arrow">↗</span></button>})}</div></section>
      <section className="section-block tracks-section"><div className="section-heading"><div><span className="section-kicker">YOUR NEXT OBSESSION</span><h2>{mood==='all'?'Fresh discoveries':`${moods.find(m=>m.id===mood)?.label || 'Fresh'} mix`}<em>.</em></h2></div><span className="track-count">{filtered.length} TRACKS</span></div><div className="track-grid">{filtered.map((song,i)=><article className="track-card" key={song.id}><div className="track-cover-wrap"><Cover song={song}/><button className="cover-play" onClick={()=>chooseSong(song)}><Play size={17} fill="currentColor"/></button><span className="track-index">0{i+1}</span></div><div className="track-details"><div><b>{song.title}</b><small>{song.artist}</small></div><button className={`like-btn ${likes.some(s=>s.id===song.id)?'liked':''}`} onClick={()=>toggleLike(song)}><Heart size={17} fill={likes.some(s=>s.id===song.id)?'currentColor':'none'}/></button></div><div className="track-foot"><span>{song.mood}</span><span>{formatTime(song.duration_seconds)}</span></div></article>)}</div>{!filtered.length&&<div className="empty-state">No tracks found. Try another mood or search.</div>}</section>
      <footer>© 2026 SONIQ <span>BUILT AROUND YOUR FREQUENCY</span><span className="api-status"><i></i> API CONNECTED WHEN BACKEND IS RUNNING</span></footer></>}
      {activePage !== 'overview' && <section className="page-view">
        {activePage==='search' && <TrackCollection songs={filtered} onPlay={chooseSong} onLike={toggleLike} likes={likes} formatTime={formatTime} title={`Search results for “${search}”`} empty="No matches found. Try a song title, artist, album, or mood." />}
        {activePage==='settings' && <div className="settings-panel"><h2>Account settings</h2><p>Manage your SONIQ profile and playback preferences.</p>{token ? <form className="playlist-form" onSubmit={updateProfile}><label>Display name<input value={profileName} onChange={e=>setProfileName(e.target.value)} minLength={2} maxLength={100} required /></label><label>Email<input value={user?.email || ''} disabled /></label><button className="primary-btn" type="submit">Save profile</button></form> : <div className="empty-state">Sign in to manage your profile. <button className="primary-btn" onClick={()=>setAuthOpen(true)}>Sign in</button></div>}<div className="settings-row"><span><b>Shuffle playback</b><small>Choose tracks in random order.</small></span><button className={`text-btn ${shuffle?'selected':''}`} onClick={()=>setShuffle(v=>!v)}>{shuffle?'Enabled':'Disabled'}</button></div><div className="settings-row"><span><b>Repeat mode</b><small>Off, repeat all, or repeat one track.</small></span><button className="text-btn" onClick={()=>setRepeatMode(v=>v==='off'?'all':v==='all'?'one':'off')}>{repeatMode.toUpperCase()}</button></div><div className="settings-row"><span><b>Audio quality</b><small>Playback quality follows the supplied audio source.</small></span><span className="section-kicker">SOURCE DEPENDENT</span></div></div>}
        <div className="page-heading"><div><span className="section-kicker">SONIQ WORKSPACE</span><h1>{selectedPlaylist ? selectedPlaylist.name : ({discover:'Discover music',mixes:'AI mood mixes',library:'Your library',liked:'Liked songs',history:'Recently played',settings:'Settings',search:'Search results'}[activePage] || 'Your music')}</h1><p>{selectedPlaylist ? (selectedPlaylist.description || 'Your personal collection') : ({discover:'Explore tracks and find your next favourite sound.',mixes:'Choose a mood and get a matching set of tracks.',library:'Manage your playlists and listening activity.',liked:'All the tracks you have saved.',history:'Your recently played tracks, synced to your account.',settings:'Update your profile and playback preferences.',search:'Find tracks across your music library.'}[activePage])}</p></div>{activePage==='library' && <button className="primary-btn" onClick={() => setShowPlaylistForm(v=>!v)}><Plus size={16}/> Create playlist</button>}</div>
        {search.trim() ? <TrackCollection songs={filtered} onPlay={chooseSong} onLike={toggleLike} likes={likes} formatTime={formatTime} title={`Search results for “${search.trim()}”`} empty="No matching tracks. Try a song title, artist, album, or mood." /> : <>
        {activePage==='discover' && <><div className="mood-grid page-moods">{moods.map(m=>{const Icon=m.icon;return <button key={m.id} className={`mood-card ${mood===m.id?'chosen':''}`} onClick={()=>setMood(m.id)} style={{'--mood-color':m.color}}><span className="mood-icon"><Icon size={20}/></span><b>{m.label}</b><small>Explore {m.label.toLowerCase()} tracks</small></button>})}</div><TrackCollection songs={filtered} onPlay={chooseSong} onLike={toggleLike} likes={likes} formatTime={formatTime} title="Explore all tracks" /></>}
        {activePage==='mixes' && <><div className="mood-grid page-moods">{moods.map(m=>{const Icon=m.icon;return <button key={m.id} className={`mood-card ${mood===m.id?'chosen':''}`} onClick={()=>{setMood(m.id);loadRecommendations(m.id);}} style={{'--mood-color':m.color}}><span className="mood-icon"><Icon size={20}/></span><b>{m.label} mix</b><small>Build a {m.label.toLowerCase()} session</small></button>})}</div><TrackCollection songs={recommendations.length?recommendations:songs.filter(s=>s.mood===mood)} onPlay={chooseSong} onLike={toggleLike} likes={likes} formatTime={formatTime} title={`${moods.find(m=>m.id===mood)?.label || 'Chill'} recommendations`} /></>}
        {activePage==='liked' && <TrackCollection songs={likes} onPlay={chooseSong} onLike={toggleLike} likes={likes} formatTime={formatTime} title="Your saved music" empty="No liked songs yet. Tap the heart on any track to save it here." /> }
        {activePage==='history' && (token ? <TrackCollection songs={history} onPlay={chooseSong} onLike={toggleLike} likes={likes} formatTime={formatTime} title="Recently played" empty="Your listening history will appear here after you play tracks." /> : <div className="empty-state">Sign in to see your listening history. <button className="primary-btn" onClick={()=>setAuthOpen(true)}>Sign in</button></div>)}
        {activePage==='library' && <>{!token ? <div className="empty-state">Sign in to sync your playlists and listening history. <button className="primary-btn" onClick={()=>setAuthOpen(true)}>Sign in</button></div> : <>{showPlaylistForm && <form className="playlist-form" onSubmit={createPlaylist}><input value={playlistName} onChange={e=>setPlaylistName(e.target.value)} placeholder="Playlist name" required maxLength={150}/><input value={playlistDescription} onChange={e=>setPlaylistDescription(e.target.value)} placeholder="Description (optional)" maxLength={500}/><button className="primary-btn" type="submit">Save playlist</button><button type="button" className="text-btn" onClick={()=>setShowPlaylistForm(false)}>Cancel</button></form>}<div className="playlist-grid">{playlists.map(pl=><article className="playlist-card" key={pl.id}><button className="playlist-open" onClick={()=>openPlaylist(pl)}><span className="playlist-art"><Disc3 size={34}/></span><b>{pl.name}</b><small>{pl.song_count} tracks</small><span>{pl.description || 'Open playlist →'}</span></button><div className="playlist-actions"><button type="button" onClick={()=>editPlaylist(pl)}>Rename / Edit</button><button type="button" onClick={()=>deletePlaylist(pl)}>Delete</button></div></article>)}</div>{!playlists.length && !showPlaylistForm && <div className="empty-state">You haven't created a playlist yet. Create your first playlist.</div>}</>}</>}
        {selectedPlaylist && <div className="playlist-detail"><button className="text-btn" onClick={()=>setSelectedPlaylist(null)}><ArrowLeft size={15}/> Back to playlists</button><div className="playlist-add"><span>Add a track</span><select id="playlist-track-select" defaultValue=""><option value="">Choose a song</option>{songs.map(song=><option key={song.id} value={song.id}>{song.title} — {song.artist}</option>)}</select><button className="primary-btn" onClick={()=>{const id=Number(document.getElementById('playlist-track-select')?.value);const song=songs.find(s=>s.id===id);if(song)addToPlaylist(selectedPlaylist,song);}}>Add</button></div><TrackCollection songs={playlistSongs} onPlay={chooseSong} onLike={toggleLike} likes={likes} formatTime={formatTime} title="Playlist tracks" empty="This playlist is empty. Add tracks above." onRemove={removeFromPlaylist}/></div>}
        </>}
      </section>}

    </main>
    <aside className="right-panel"><div className="panel-title"><div><span className="section-kicker">YOUR SESSION</span><h3>Up next <span>{queue.length}</span></h3></div><button className="icon-btn" onClick={()=>setQueue([])} title="Clear queue"><X size={17}/></button></div><div className="now-playing"><div className="now-cover"><Cover song={current || demoSongs[0]}/><span className="now-pulse"></span></div><div className="now-info"><small>NOW PLAYING</small><b>{current?.title || 'Choose a track'}</b><span>{current?.artist || 'SONIQ radio'}</span></div><button className="icon-btn" onClick={()=>current&&toggleLike(current)}><Heart size={17}/></button></div><div className="wave-visualizer">{Array.from({length:36},(_,i)=><i key={i} style={{height:`${12+Math.abs(Math.sin(i*.62))*55+Math.abs(Math.cos(i*.19))*18}px`,animationDelay:`${i*-.07}s`}}/>)}</div><div className="queue-head"><b><ListMusic size={16}/> PLAY QUEUE</b><button onClick={()=>setQueue(songs.filter(s=>s.id!==current?.id).slice(0,6))}>Refresh</button></div><div className="queue-list">{queue.map((s,i)=><button className="queue-item" key={s.id} onClick={()=>chooseSong(s)}><span className="queue-num">{String(i+1).padStart(2,'0')}</span><Cover song={s}/><span className="queue-track"><b>{s.title}</b><small>{s.artist}</small></span><span className="queue-duration">{formatTime(s.duration_seconds)}</span></button>)}{!queue.length&&<p className="queue-empty">Your queue is clear. Add a track to keep the vibe going.</p>}</div><div className="mixes-block"><div className="queue-head"><b><AudioLines size={16}/> QUICK MIXES</b><span>AI PICKS</span></div>{moods.slice(0,3).map((m,i)=><button className="quick-mix" key={m.id} onClick={()=>{setMood(m.id);const song=songs.find(s=>s.mood===m.id);if(song)chooseSong(song)}}><span className={`mix-thumb mix-${i}`}><m.icon size={18}/></span><span><b>{m.label} mode</b><small>{i===0?'Soft and spacious':i===1?'Deep work flow':'High energy set'}</small></span><Play size={15}/></button>)}</div><div className="session-tip"><span>✦</span><div><b>Let the mood lead.</b><p>Pick a vibe and SONIQ will line up a matching mix.</p></div></div></aside>
    <div className="player-bar"><div className="player-track"><Cover song={current || demoSongs[0]}/><div><b>{current?.title || 'Select a track'}</b><small>{current?.artist || 'SONIQ'}</small></div><button className={`like-btn ${likes.some(s=>s.id===current?.id)?'liked':''}`} onClick={()=>current&&toggleLike(current)}><Heart size={16} fill={likes.some(s=>s.id===current?.id)?'currentColor':'none'}/></button></div><div className="player-center"><div className="player-controls"><button onClick={previousSong} title="Previous"><SkipBack size={17} fill="currentColor"/></button><button className="main-play" onClick={togglePlayback}>{playing?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}</button><button onClick={nextSong} title="Next"><SkipForward size={17} fill="currentColor"/></button><button className={shuffle?'player-mode active':'player-mode'} title="Shuffle" onClick={()=>setShuffle(v=>!v)}>SHF</button><button className={repeatMode!=='off'?'player-mode active':'player-mode'} title="Repeat mode" onClick={()=>setRepeatMode(v=>v==='off'?'all':v==='all'?'one':'off')}>REP</button></div><div className="progress-row"><span>{formatTime(Math.floor(currentTime))}</span><input aria-label="Track progress" className="progress-track" type="range" min="0" max={duration || 0} step="1" value={Math.min(currentTime, duration || currentTime)} onChange={e=>{const nextTime=Number(e.target.value);if(audioRef.current){audioRef.current.currentTime=nextTime;setCurrentTime(nextTime)}}} disabled={!duration}/><span>{formatTime(Math.floor(duration || current?.duration_seconds || 0))}</span></div></div><div className="player-volume"><Waves size={18}/><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><Volume2 size={17}/></div></div>
<audio
  ref={audioRef}
  preload="metadata"
  onPlay={() => setPlaying(true)}
  onPause={() => setPlaying(false)}
  onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime || 0)}
  onLoadedMetadata={e => {
    const loadedDuration = e.currentTarget.duration;
    if (Number.isFinite(loadedDuration)) setDuration(loadedDuration);
  }}
  onDurationChange={e => {
    const loadedDuration = e.currentTarget.duration;
    if (Number.isFinite(loadedDuration)) setDuration(loadedDuration);
  }}
 onEnded={() => {
  console.log('SONIQ Repeat Mode:', repeatMode);

  if (repeatMode === 'one') {
    const audio = audioRef.current;

    if (audio) {
      audio.currentTime = 0;
      audio.play()
        .then(() => setPlaying(true))
        .catch(error => {
          console.error('Repeat One failed:', error);
          setPlaying(false);
          setNotice('Could not replay this track.');
        });
    }
    return;
  }

  if (
    repeatMode === 'off' &&
    current &&
    songs.findIndex(s => Number(s.id) === Number(current.id)) === songs.length - 1
  ) {
    setPlaying(false);
    return;
  }

  nextSong();
}}
  onError={e => {
    const mediaError = e.currentTarget.error;
    console.error('SONIQ audio element error:', {
      code: mediaError?.code,
      message: mediaError?.message,
      source: e.currentTarget.currentSrc
    });
    setPlaying(false);
    setNotice('Audio file could not be loaded. Check the track URL or try another track.');
  }}
/>
   {notice && (
  <div className="toast">
    <span>{notice}</span>
    <button onClick={() => setNotice('')} aria-label="Close message">
      <X size={14} />
    </button>
  </div>
)}
    {authOpen&&<div className="modal-backdrop" onClick={()=>setAuthOpen(false)}><form className="auth-modal" onSubmit={authenticate} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setAuthOpen(false)}><X size={18}/></button><div className="brand-mark"><AudioLines size={23}/></div><h2>{authMode==='login'?'Welcome back.':'Find your frequency.'}</h2><p>{authMode==='login'?'Sign in to sync your music space.':'Create your SONIQ account.'}</p>{authMode==='register'&&<label>Name<input name="name" required minLength="2" placeholder="Your name"/></label>}<label>Email<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required minLength="8" placeholder="At least 8 characters"/></label><button className="primary-btn auth-submit" type="submit">{authMode==='login'?'Sign in':'Create account'} <span>↗</span></button><button type="button" className="switch-auth" onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?"New here? Create an account":"Already have an account? Sign in"}</button></form></div>}
  </div>;
}
export default App;
