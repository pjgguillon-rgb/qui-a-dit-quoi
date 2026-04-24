import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users, Plus, Send, Eye, Trophy, ArrowRight, Copy, Check, Sparkles,
  RotateCcw, Crown, Volume2, VolumeX, Settings, X, UserX, Palette,
  Info, ChevronLeft
} from 'lucide-react';
import { storage } from './firebase.js';

// ============ UTILITAIRES ============
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generatePlayerId = () => {
  const existing = typeof window !== 'undefined' ? localStorage.getItem('qdq_playerId') : null;
  if (existing) return existing;
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (typeof window !== 'undefined') localStorage.setItem('qdq_playerId', id);
  return id;
};

const saveLocalSession = (data) => {
  try { localStorage.setItem('qdq_session', JSON.stringify(data)); } catch {}
};
const loadLocalSession = () => {
  try { return JSON.parse(localStorage.getItem('qdq_session') || 'null'); } catch { return null; }
};
const clearLocalSession = () => {
  try { localStorage.removeItem('qdq_session'); } catch {}
};

const AVATAR_COLORS = [
  '#E94F37', '#F5B841', '#4CB944', '#3D5A80', '#9B5DE5',
  '#F15BB5', '#00BBF9', '#FB8500', '#8338EC', '#06A77D',
  '#E63946', '#457B9D'
];

const EMOJI_AVATARS = [
  '🎮', '🚀', '🌸', '🐼', '🦄', '🔥', '⚡', '🌙',
  '🎸', '🍕', '🐙', '🦊', '🌊', '🍄', '👻', '🤖',
  '🎨', '🦋', '🌈', '🐉', '🍉', '🌺', '🎭', '⭐',
  '🐨', '🦁', '🐸', '🍀', '💎', '🎪', '🌻', '🐝'
];

// ============ MODES DE JEU ============
const GAME_MODES = {
  classic: {
    key: 'classic',
    label: 'Classique',
    icon: '💬',
    shortDesc: 'Le mode original',
    description: 'Chacun répond à la question. Les réponses sont mélangées et tout le monde doit deviner qui a dit quoi.',
    scoring: '1 point par bonne devinette'
  },
  bluff: {
    key: 'bluff',
    label: 'Bluff',
    icon: '🎭',
    shortDesc: 'Avec fausses réponses',
    description: 'Chacun écrit 1 vraie réponse + 1 fausse (bluff). Phase 1 : devinez quelles réponses sont des bluffs. Phase 2 : associez les vraies réponses à leur auteur.',
    scoring: '+2 par bluff démasqué · +1 par vraie réponse trouvée · +1 si votre bluff trompe quelqu\'un'
  },
  mostLikely: {
    key: 'mostLikely',
    label: 'Qui est le plus...',
    icon: '👉',
    shortDesc: 'Vote pour un joueur',
    description: 'Au lieu d\'écrire une réponse, chacun vote secrètement pour un joueur du groupe. Révélation du verdict à la fin.',
    scoring: 'Pas de score — juste pour le fun et la discussion 😄'
  }
};

// ============ THÈMES ============
const THEMES = {
  classique: {
    name: 'Classique', icon: '☕',
    bg: '#faf7f2', text: '#1a1a1a', textSoft: '#6b655c', textMuted: '#a8a299',
    border: '#e5e0d8', borderDark: '#d4cec3',
    card: '#faf7f2', dark: '#1a1a1a',
    accent: '#E94F37', accentBg: '#F5B841', accentText: '#F5B841',
    success: '#4CB944', purple: '#9B5DE5',
    displayFont: "'Fraunces', Georgia, serif",
    bodyFont: "'DM Sans', sans-serif",
    grain: `radial-gradient(circle at 20% 30%, rgba(233, 79, 55, 0.08), transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(155, 93, 229, 0.08), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(245, 184, 65, 0.05), transparent 60%)`
  },
  sombre: {
    name: 'Minuit', icon: '🌙',
    bg: '#0f0f14', text: '#f0ebe0', textSoft: '#9a9590', textMuted: '#5a554f',
    border: '#2a2832', borderDark: '#3a3844',
    card: '#1a1822', dark: '#f0ebe0',
    accent: '#ff6b47', accentBg: '#ffa726', accentText: '#ffa726',
    success: '#5FD068', purple: '#b57dff',
    displayFont: "'Fraunces', Georgia, serif",
    bodyFont: "'DM Sans', sans-serif",
    darkIsLight: true,
    grain: `radial-gradient(circle at 20% 30%, rgba(255, 107, 71, 0.12), transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(181, 125, 255, 0.12), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 167, 38, 0.08), transparent 60%)`
  },
  fete: {
    name: 'Fête', icon: '🎉',
    bg: '#fff0f5', text: '#2d0a4e', textSoft: '#6b3e8f', textMuted: '#a988c7',
    border: '#f4c8e0', borderDark: '#e8a8d0',
    card: '#fff0f5', dark: '#2d0a4e',
    accent: '#ff006e', accentBg: '#ffbe0b', accentText: '#ffbe0b',
    success: '#06d6a0', purple: '#8338ec',
    displayFont: "'Fraunces', Georgia, serif",
    bodyFont: "'DM Sans', sans-serif",
    grain: `radial-gradient(circle at 15% 25%, rgba(255, 0, 110, 0.15), transparent 45%),
            radial-gradient(circle at 85% 60%, rgba(131, 56, 236, 0.15), transparent 45%),
            radial-gradient(circle at 50% 80%, rgba(255, 190, 11, 0.12), transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(6, 214, 160, 0.1), transparent 45%)`
  },
  retro: {
    name: 'Rétro', icon: '📺',
    bg: '#f4e8d0', text: '#3a2817', textSoft: '#7a5a3f', textMuted: '#b89868',
    border: '#d4b896', borderDark: '#c4a478',
    card: '#f4e8d0', dark: '#3a2817',
    accent: '#d2691e', accentBg: '#e8b04e', accentText: '#e8b04e',
    success: '#739e82', purple: '#a56cc1',
    displayFont: "'Fraunces', Georgia, serif",
    bodyFont: "'DM Sans', sans-serif",
    grain: `radial-gradient(circle at 20% 30%, rgba(210, 105, 30, 0.1), transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(165, 108, 193, 0.08), transparent 50%)`
  }
};

// ============ SONS & VIBRATIONS ============
const playSound = (freq, duration = 120, enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    osc.start(); osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
};

const playChord = (freqs, duration = 300, enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + duration / 1000);
    });
  } catch {}
};

const vibrate = (pattern, enabled = true) => {
  if (!enabled) return;
  try { navigator.vibrate?.(pattern); } catch {}
};

// ============ NOTIFICATIONS ============
const flashTitle = (() => {
  let interval = null;
  const original = typeof document !== 'undefined' ? document.title : '';
  return (message) => {
    if (interval) { clearInterval(interval); interval = null; document.title = original; }
    if (!message) return;
    let toggle = false;
    interval = setInterval(() => {
      document.title = toggle ? original : `🔔 ${message}`;
      toggle = !toggle;
    }, 800);
    const stop = () => {
      if (interval) { clearInterval(interval); interval = null; document.title = original; }
      window.removeEventListener('focus', stop);
    };
    window.addEventListener('focus', stop);
  };
})();

const sendPushNotification = (title, body) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification(title, { body, icon: '/favicon.ico', tag: 'qdq' });
    }
  } catch {}
};

const requestNotifPermission = async () => {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch {}
};

// ============ STYLES ============
const GlobalStyles = ({ theme }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,600&family=DM+Sans:wght@400;500;700&display=swap');
    .qdq-root * { font-family: ${theme.bodyFont}; box-sizing: border-box; }
    .qdq-display { font-family: ${theme.displayFont}; font-optical-sizing: auto; letter-spacing: -0.02em; }
    .qdq-italic { font-family: ${theme.displayFont}; font-style: italic; font-weight: 600; }
    @keyframes qdq-fadeup { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes qdq-pop { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.03); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes qdq-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes qdq-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
    @keyframes qdq-float { 0% { transform: translateY(100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(-100px) rotate(720deg); opacity: 0; } }
    @keyframes qdq-slide-in { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .qdq-fadeup { animation: qdq-fadeup 0.4s ease-out both; }
    .qdq-pop { animation: qdq-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .qdq-pulse { animation: qdq-pulse 1.8s ease-in-out infinite; }
    .qdq-shake { animation: qdq-shake 0.4s ease-in-out; }
    .qdq-btn { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
    .qdq-btn:active { transform: translateY(1px) scale(0.98); }
    .qdq-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .qdq-grain { background-image: ${theme.grain}; }
    input, textarea { font-family: ${theme.bodyFont}; }
    input:focus, textarea:focus { outline: none; border-color: ${theme.text} !important; }
    .qdq-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .qdq-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .qdq-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 2px; }
    .qdq-confetti { position: fixed; top: 0; width: 10px; height: 14px; pointer-events: none; z-index: 9999; animation: qdq-float linear forwards; }
  `}</style>
);

// ============ CONFETTIS ============
const launchConfetti = (theme) => {
  const colors = [theme.accent, theme.accentBg, theme.success, theme.purple];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(container);
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'qdq-confetti';
    el.style.left = Math.random() * 100 + '%';
    el.style.background = colors[i % colors.length];
    el.style.animationDuration = (2 + Math.random() * 2) + 's';
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    el.style.transform = `translateY(100vh) rotate(${Math.random() * 360}deg)`;
    container.appendChild(el);
  }
  setTimeout(() => container.remove(), 5000);
};

// ============ COMPOSANTS UI ============
const Avatar = ({ emoji, name, color, size = 40 }) => {
  if (emoji) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}>
        {emoji}
      </div>
    );
  }
  return (
    <div className="qdq-display" style={{
      width: size, height: size, borderRadius: '50%', background: color, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
    }}>
      {name?.slice(0, 1).toUpperCase() || '?'}
    </div>
  );
};

const Button = ({ children, onClick, disabled, variant = 'primary', style = {}, fullWidth = true, theme }) => {
  const variants = {
    primary: { background: theme.dark, color: theme.darkIsLight ? theme.bg : theme.bg, border: 'none' },
    secondary: { background: 'transparent', color: theme.text, border: `1.5px solid ${theme.text}` },
    accent: { background: theme.accent, color: 'white', border: 'none' }
  };
  return (
    <button className="qdq-btn" onClick={onClick} disabled={disabled} style={{
      ...variants[variant], padding: '16px 24px', borderRadius: 14, fontSize: 16,
      fontWeight: 600, cursor: 'pointer', width: fullWidth ? '100%' : 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...style
    }}>
      {children}
    </button>
  );
};

// ============ MODALE DE CONFIRMATION DE SORTIE ============
const ConfirmLeaveModal = ({ onConfirm, onCancel, theme }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  }} onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} className="qdq-pop" style={{
      background: theme.bg, borderRadius: 24, padding: 28,
      width: '100%', maxWidth: 380, textAlign: 'center'
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
      <h3 className="qdq-display" style={{
        fontSize: 24, fontWeight: 700, color: theme.text,
        margin: '0 0 10px 0'
      }}>
        Quitter la partie ?
      </h3>
      <p style={{
        color: theme.textSoft, fontSize: 14, lineHeight: 1.5,
        margin: '0 0 24px 0'
      }}>
        Tu peux toujours rejoindre de nouveau avec le code du salon.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button variant="accent" theme={theme} onClick={onConfirm}>
          Oui, quitter
        </Button>
        <Button variant="secondary" theme={theme} onClick={onCancel}>
          Non, rester
        </Button>
      </div>
    </div>
  </div>
);

// ============ BARRE DU HAUT (visible sur tous les écrans de partie) ============
const TopBar = ({ room, playerId, onLeave, onOpenSettings, theme, showPhase }) => {
  const me = room?.players?.find(p => p.id === playerId);
  const currentRound = room?.settings?.currentRound || 0;
  const totalRounds = room?.settings?.totalRounds || 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 20, gap: 12
    }}>
      <button onClick={onLeave} className="qdq-btn" style={{
        background: 'transparent', border: `1.5px solid ${theme.border}`,
        color: theme.textSoft, fontSize: 13, cursor: 'pointer',
        padding: '8px 14px', borderRadius: 100, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6
      }}>
        <ChevronLeft size={14} /> Quitter
      </button>

      {showPhase && currentRound > 0 && (
        <div style={{
          fontSize: 11, color: theme.textSoft, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          textAlign: 'center'
        }}>
          Manche {currentRound}{totalRounds > 0 ? `/${totalRounds}` : ''}
        </div>
      )}

      <button onClick={onOpenSettings} className="qdq-btn" style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 8, color: theme.textSoft
      }}>
        <Settings size={20} />
      </button>
    </div>
  );
};

// ============ MODAL PARAMÈTRES ============
const SettingsModal = ({ onClose, theme, themeName, setThemeName, soundEnabled, setSoundEnabled, notifEnabled, setNotifEnabled }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
  }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: theme.bg, borderRadius: '24px 24px 0 0', padding: 28,
      width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto',
      animation: 'qdq-slide-in 0.3s ease-out'
    }} className="qdq-scrollbar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="qdq-display" style={{ fontSize: 24, fontWeight: 700, color: theme.text, margin: 0 }}>
          Paramètres
        </h2>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: theme.textSoft
        }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 10,
          textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <Palette size={14} /> Thème
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} onClick={() => setThemeName(key)} className="qdq-btn" style={{
              padding: '14px 12px', borderRadius: 14,
              background: themeName === key ? t.dark : t.bg,
              color: themeName === key ? (t.darkIsLight ? t.bg : t.bg) : t.text,
              border: `2px solid ${themeName === key ? t.accent : t.border}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13
            }}>
              <div style={{ fontSize: 22 }}>{t.icon}</div>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 16, background: theme.card, border: `1.5px solid ${theme.border}`,
          borderRadius: 14, cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {soundEnabled ? <Volume2 size={18} color={theme.text} /> : <VolumeX size={18} color={theme.textSoft} />}
            <span style={{ fontWeight: 600, color: theme.text }}>Sons & vibrations</span>
          </div>
          <div onClick={() => setSoundEnabled(!soundEnabled)} style={{
            width: 44, height: 26, borderRadius: 13,
            background: soundEnabled ? theme.accent : theme.border,
            position: 'relative', transition: 'background 0.2s'
          }}>
            <div style={{
              position: 'absolute', top: 3, left: soundEnabled ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </div>
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 16, background: theme.card, border: `1.5px solid ${theme.border}`,
          borderRadius: 14, cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 18 }}>🔔</div>
            <span style={{ fontWeight: 600, color: theme.text }}>Notifications</span>
          </div>
          <div onClick={() => {
            const next = !notifEnabled;
            setNotifEnabled(next);
            if (next) requestNotifPermission();
          }} style={{
            width: 44, height: 26, borderRadius: 13,
            background: notifEnabled ? theme.accent : theme.border,
            position: 'relative', transition: 'background 0.2s'
          }}>
            <div style={{
              position: 'absolute', top: 3, left: notifEnabled ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </div>
        </label>
        <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 8, lineHeight: 1.4 }}>
          Alerte quand c'est ton tour, même si tu changes d'onglet.
        </p>
      </div>
    </div>
  </div>
);

// ============ MODAL INFO MODE ============
const ModeInfoModal = ({ mode, onClose, theme }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: theme.bg, borderRadius: 24, padding: 28,
      width: '100%', maxWidth: 420, position: 'relative'
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16,
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 4, color: theme.textSoft
      }}>
        <X size={20} />
      </button>
      <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>{mode.icon}</div>
      <h3 className="qdq-display" style={{
        fontSize: 26, fontWeight: 700, color: theme.text,
        textAlign: 'center', margin: '0 0 16px 0'
      }}>
        {mode.label}
      </h3>
      <p style={{
        color: theme.textSoft, fontSize: 15, lineHeight: 1.6,
        margin: '0 0 20px 0'
      }}>
        {mode.description}
      </p>
      <div style={{
        padding: 16, background: theme.card,
        borderRadius: 14, border: `1.5px solid ${theme.border}`
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: theme.accent,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8
        }}>
          ⭐ Points
        </div>
        <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.5 }}>
          {mode.scoring}
        </div>
      </div>
    </div>
  </div>
);

// ============ ÉCRAN ACCUEIL ============
const HomeScreen = ({ onCreate, onJoin, theme, onOpenSettings }) => {
  const [mode, setMode] = useState('home');
  const [name, setName] = useState(() => localStorage.getItem('qdq_lastName') || '');
  const [code, setCode] = useState('');
  const [emoji, setEmoji] = useState(() => localStorage.getItem('qdq_lastEmoji') || EMOJI_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return setError('Entre ton prénom');
    localStorage.setItem('qdq_lastName', name.trim());
    localStorage.setItem('qdq_lastEmoji', emoji);
    setLoading(true); setError('');
    await onCreate(name.trim(), emoji);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError('Entre ton prénom');
    if (code.length !== 5) return setError('Le code fait 5 caractères');
    localStorage.setItem('qdq_lastName', name.trim());
    localStorage.setItem('qdq_lastEmoji', emoji);
    setLoading(true); setError('');
    const ok = await onJoin(name.trim(), code.toUpperCase(), emoji);
    if (!ok) setError('Salon introuvable ou partie déjà commencée');
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <button onClick={onOpenSettings} className="qdq-btn" style={{
        position: 'absolute', top: 16, right: 16, background: 'transparent',
        border: 'none', cursor: 'pointer', padding: 8, color: theme.textSoft
      }}>
        <Settings size={22} />
      </button>

      <div className="qdq-fadeup" style={{ textAlign: 'center', marginTop: 40, marginBottom: 48 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', background: theme.dark,
          color: theme.accentText, borderRadius: 100, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20
        }}>
          ✦ Jeu entre amis
        </div>
        <h1 className="qdq-display" style={{
          fontSize: 64, fontWeight: 800, margin: 0, lineHeight: 0.95, color: theme.text
        }}>
          Qui a dit<br/>
          <span className="qdq-italic" style={{ color: theme.accent }}>quoi ?</span>
        </h1>
        <p style={{ marginTop: 16, color: theme.textSoft, fontSize: 16, lineHeight: 1.5, maxWidth: 320, margin: '16px auto 0' }}>
          Une question. Tout le monde répond en secret. Devinez qui a dit quoi.
        </p>
      </div>

      {mode === 'home' && (
        <div className="qdq-fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="primary" theme={theme} onClick={() => setMode('create')}>
            <Plus size={18} /> Créer un salon
          </Button>
          <Button variant="secondary" theme={theme} onClick={() => setMode('join')}>
            <ArrowRight size={18} /> Rejoindre un salon
          </Button>
        </div>
      )}

      {mode !== 'home' && (
        <div className="qdq-fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8, display: 'block' }}>
              Choisis ton avatar
            </label>
            <div className="qdq-scrollbar" style={{
              display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0', marginBottom: 4
            }}>
              {EMOJI_AVATARS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className="qdq-btn" style={{
                  minWidth: 48, height: 48, borderRadius: 12,
                  border: emoji === e ? `2px solid ${theme.accent}` : `1.5px solid ${theme.border}`,
                  background: emoji === e ? theme.accent + '20' : theme.card,
                  fontSize: 24, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8, display: 'block' }}>
              Ton prénom
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Alex" maxLength={20}
              style={{ width: '100%', padding: '16px 18px', fontSize: 16,
                border: `1.5px solid ${theme.border}`, borderRadius: 14,
                background: theme.card, color: theme.text }}/>
          </div>

          {mode === 'join' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8, display: 'block' }}>
                Code du salon
              </label>
              <input type="text" value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="ABCDE" maxLength={5}
                style={{ width: '100%', padding: '16px 18px', fontSize: 22, fontWeight: 700,
                  letterSpacing: '0.3em', textAlign: 'center',
                  border: `1.5px solid ${theme.border}`, borderRadius: 14,
                  background: theme.card, color: theme.text,
                  fontFamily: theme.displayFont }}/>
            </div>
          )}

          {error && <div className="qdq-shake" style={{ color: theme.accent, fontSize: 14, textAlign: 'center' }}>{error}</div>}

          <Button variant="accent" theme={theme} onClick={mode === 'create' ? handleCreate : handleJoin} disabled={loading}>
            {loading ? 'Connexion...' : (mode === 'create' ? 'Créer le salon' : 'Rejoindre')}
          </Button>

          <button onClick={() => { setMode('home'); setError(''); }}
            style={{ background: 'none', border: 'none', color: theme.textSoft,
              fontSize: 14, cursor: 'pointer', padding: 8 }}>
            ← Retour
          </button>
        </div>
      )}

      <div style={{ marginTop: 60, textAlign: 'center', color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}>
        <p>Les salons sont partagés entre tous les joueurs.<br/>Partagez le code avec vos amis.</p>
      </div>
    </div>
  );
};

// ============ ÉCRAN LOBBY ============
const LobbyScreen = ({ room, playerId, onStart, onLeave, onKick, onUpdateTotalRounds, theme, onOpenSettings, soundEnabled }) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;
  const [question, setQuestion] = useState('');

  // Si la partie a déjà commencé, on utilise le mode et le nombre de manches du salon
  const gameInProgress = (room.settings?.currentRound || 0) > 0;
  const [questionMode, setQuestionMode] = useState(gameInProgress ? room.settings.questionMode : 'classic');
  const [totalRounds, setTotalRounds] = useState(room.settings?.totalRounds || 0);
  const [showModeInfo, setShowModeInfo] = useState(null);

  // Si la partie est en cours, forcer le mode utilisé
  useEffect(() => {
    if (gameInProgress && room.settings?.questionMode) {
      setQuestionMode(room.settings.questionMode);
    }
  }, [gameInProgress, room.settings?.questionMode]);

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    playSound(660, 80, soundEnabled);
    setTimeout(() => setCopied(false), 1500);
  };

  const CLASSIC_SUGGESTIONS = [
    "Ta pire honte ?",
    "Si tu étais invisible 1h, tu ferais quoi ?",
    "Le pire cadeau que tu as reçu ?",
    "Ton plus grand fantasme de vacances ?",
    "Un talent caché que personne ne connaît ?",
    "Ta plus grosse peur absurde ?",
    "Un truc que tu regrettes d'avoir fait hier ?",
    "Ta chanson coupable préférée ?",
    "Ton plus gros mensonge d'enfance ?"
  ];

  const MOST_LIKELY_SUGGESTIONS = [
    "Qui est le plus susceptible de finir milliardaire ?",
    "Qui est le plus susceptible de devenir célèbre ?",
    "Qui oublierait son propre anniversaire ?",
    "Qui finirait en prison pour une raison stupide ?",
    "Qui se ferait avoir par une arnaque évidente ?",
    "Qui ferait le meilleur parent ?",
    "Qui partirait vivre dans une cabane en forêt ?",
    "Qui adopterait 10 chats ?"
  ];

  const pickRandom = () => {
    const list = questionMode === 'mostLikely' ? MOST_LIKELY_SUGGESTIONS : CLASSIC_SUGGESTIONS;
    setQuestion(list[Math.floor(Math.random() * list.length)]);
  };

  const currentModeData = GAME_MODES[questionMode];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
      {showModeInfo && <ModeInfoModal mode={showModeInfo} onClose={() => setShowModeInfo(null)} theme={theme} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={onLeave} style={{
          background: 'transparent', border: 'none', color: theme.textSoft,
          fontSize: 14, cursor: 'pointer', padding: 4
        }}>← Quitter</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: theme.textSoft, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Salon
          </div>
          <button onClick={onOpenSettings} className="qdq-btn" style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: theme.textSoft
          }}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="qdq-pop" style={{
        background: theme.dark, borderRadius: 24, padding: 32, textAlign: 'center',
        marginBottom: 28, position: 'relative', overflow: 'hidden'
      }}>
        <div className="qdq-grain" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: theme.accentText, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            Code à partager
          </div>
          <div className="qdq-display" style={{ fontSize: 56, fontWeight: 800, color: theme.darkIsLight ? theme.bg : theme.bg, letterSpacing: '0.15em', marginBottom: 16 }}>
            {room.code}
          </div>
          <button onClick={copyCode} className="qdq-btn" style={{
            background: copied ? theme.success : theme.accentBg, color: theme.dark, border: 'none',
            padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            {copied ? <><Check size={14}/> Copié !</> : <><Copy size={14}/> Copier le code</>}
          </button>
          {gameInProgress && (
            <div style={{ marginTop: 14, fontSize: 12, color: theme.textMuted, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{GAME_MODES[room.settings.questionMode]?.icon}</span>
              Mode {GAME_MODES[room.settings.questionMode]?.label} · Manche {room.settings.currentRound}{room.settings.totalRounds > 0 ? `/${room.settings.totalRounds}` : ''}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          color: theme.text, fontSize: 13, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
          <Users size={14} /> Joueurs ({room.players.length}/12)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {room.players.map((p, i) => (
            <div key={p.id} className="qdq-fadeup" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12,
              background: theme.card, borderRadius: 14, border: `1.5px solid ${theme.border}`,
              animationDelay: `${i * 0.05}s`
            }}>
              <Avatar emoji={p.emoji} name={p.name} color={p.color} size={36} />
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: theme.text }}>
                {p.name}
                {p.id === playerId && <span style={{ color: theme.textSoft, fontWeight: 400 }}> (toi)</span>}
              </div>
              {room.settings?.totalScores?.[p.id] > 0 && (
                <div className="qdq-display" style={{ fontSize: 16, fontWeight: 700, color: theme.accentText }}>
                  {room.settings.totalScores[p.id]}
                </div>
              )}
              {p.id === room.hostId && <Crown size={16} color={theme.accentBg} fill={theme.accentBg} />}
              {isHost && p.id !== playerId && (
                <button onClick={() => onKick(p.id)} className="qdq-btn" style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: theme.textMuted, padding: 4
                }}>
                  <UserX size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div className="qdq-fadeup">
          {/* Mode de question - verrouillé si partie en cours */}
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            Mode de jeu
            {gameInProgress && <span style={{ color: theme.textMuted, fontSize: 10 }}>🔒 verrouillé</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
            {Object.values(GAME_MODES).map(m => (
              <button key={m.key}
                onClick={() => !gameInProgress && setQuestionMode(m.key)}
                disabled={gameInProgress && questionMode !== m.key}
                className="qdq-btn"
                style={{
                  padding: '10px 6px', borderRadius: 12,
                  background: questionMode === m.key ? theme.dark : theme.card,
                  color: questionMode === m.key ? (theme.darkIsLight ? theme.bg : theme.bg) : theme.text,
                  border: `1.5px solid ${questionMode === m.key ? theme.dark : theme.border}`,
                  cursor: gameInProgress && questionMode !== m.key ? 'not-allowed' : 'pointer',
                  opacity: gameInProgress && questionMode !== m.key ? 0.3 : 1,
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                }}
              >
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Description du mode sélectionné */}
          <div style={{
            padding: 12, background: theme.card, borderRadius: 12,
            border: `1px solid ${theme.border}`, marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 10
          }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{currentModeData.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: theme.textSoft, lineHeight: 1.4 }}>
                {currentModeData.shortDesc}. {currentModeData.description}
              </div>
              <button onClick={() => setShowModeInfo(currentModeData)} style={{
                background: 'transparent', border: 'none',
                color: theme.accent, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', padding: '4px 0', marginTop: 4,
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                <Info size={12} /> Détails & points
              </button>
            </div>
          </div>

          {/* Nombre de manches */}
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {gameInProgress ? 'Nombre de manches (modifiable)' : 'Durée de la partie'}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { value: 0, label: 'Libre' },
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 15, label: '15' },
              { value: 20, label: '20' }
            ].map(opt => {
              const disabled = gameInProgress && opt.value > 0 && opt.value < (room.settings?.currentRound || 0);
              return (
                <button key={opt.value}
                  onClick={() => {
                    if (disabled) return;
                    setTotalRounds(opt.value);
                    if (gameInProgress) onUpdateTotalRounds(opt.value);
                  }}
                  disabled={disabled}
                  className="qdq-btn"
                  style={{
                    flex: 1, minWidth: 50, padding: '10px 8px', borderRadius: 12,
                    background: totalRounds === opt.value ? theme.dark : theme.card,
                    color: totalRounds === opt.value ? (theme.darkIsLight ? theme.bg : theme.bg) : theme.text,
                    border: `1.5px solid ${totalRounds === opt.value ? theme.dark : theme.border}`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.3 : 1,
                    fontSize: 13, fontWeight: 700
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {questionMode === 'mostLikely' ? 'Pose ta question "Qui est le plus..."' : 'Pose ta question'}
          </div>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder={questionMode === 'mostLikely' ? 'Ex: Qui est le plus susceptible de...' : 'Ex: Si tu pouvais dire un secret...'}
            maxLength={200} rows={3}
            style={{ width: '100%', padding: '14px 16px', fontSize: 15,
              border: `1.5px solid ${theme.border}`, borderRadius: 14, background: theme.card,
              color: theme.text, resize: 'none', marginBottom: 10 }}/>
          <button onClick={pickRandom} className="qdq-btn" style={{
            background: 'transparent', border: 'none', color: theme.accent,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
            marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            <Sparkles size={14}/> Suggérer une question
          </button>
          <Button variant="accent" theme={theme}
            onClick={() => onStart(question.trim(), questionMode, totalRounds)}
            disabled={room.players.length < 2 || !question.trim()}>
            {gameInProgress ? 'Manche suivante' : 'Lancer la partie'} <ArrowRight size={18} />
          </Button>
          {room.players.length < 2 && (
            <p style={{ textAlign: 'center', color: theme.textSoft, fontSize: 13, marginTop: 12 }}>
              Il faut au moins 2 joueurs
            </p>
          )}
        </div>
      ) : (
        <div className="qdq-fadeup">
          {gameInProgress && (
            <div style={{
              padding: 12, background: theme.card, borderRadius: 12,
              border: `1px solid ${theme.border}`, marginBottom: 16,
              display: 'flex', alignItems: 'flex-start', gap: 10
            }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{GAME_MODES[room.settings.questionMode]?.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 2 }}>
                  Mode {GAME_MODES[room.settings.questionMode]?.label}
                </div>
                <div style={{ fontSize: 12, color: theme.textSoft, lineHeight: 1.4 }}>
                  {GAME_MODES[room.settings.questionMode]?.shortDesc}
                </div>
              </div>
            </div>
          )}
          <div style={{
            padding: 20, background: theme.card, borderRadius: 14,
            textAlign: 'center', border: `1.5px dashed ${theme.borderDark}`
          }}>
            <div className="qdq-pulse" style={{ fontSize: 15, color: theme.textSoft }}>
              En attente de <strong style={{ color: theme.text }}>{room.players.find(p => p.id === room.hostId)?.name}</strong> pour lancer...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ ÉCRAN RÉPONSE ============
const AnswerScreen = ({ room, playerId, onSubmit, onTyping, onLeave, onOpenSettings, theme, soundEnabled }) => {
  const [answer, setAnswer] = useState('');
  const [bluff, setBluff] = useState('');
  const me = room.players.find(p => p.id === playerId);
  const myAnswer = room.answers?.[playerId];
  const answeredIds = Object.keys(room.answers || {}).filter(id => room.answers[id]?.real);
  const totalPlayers = room.players.length;
  const mode = room.settings?.questionMode || 'classic';
  const needsBluff = mode === 'bluff';

  // Mode "Qui est le plus..." : composant dédié
  if (mode === 'mostLikely') {
    return <MostLikelyScreen room={room} playerId={playerId}
      onSubmit={(targetId) => {
        playSound(880, 100, soundEnabled);
        vibrate(50, soundEnabled);
        onSubmit(targetId, null);
      }}
      onLeave={onLeave} onOpenSettings={onOpenSettings}
      theme={theme} />;
  }

  useEffect(() => {
    if (myAnswer) return;
    if (answer.length > 0 || bluff.length > 0) {
      onTyping(true);
      const t = setTimeout(() => onTyping(false), 2000);
      return () => clearTimeout(t);
    } else {
      onTyping(false);
    }
  }, [answer, bluff, myAnswer]);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    if (needsBluff && !bluff.trim()) return;
    playSound(880, 100, soundEnabled);
    vibrate(50, soundEnabled);
    onSubmit(answer.trim(), needsBluff ? bluff.trim() : null);
  };

  if (myAnswer) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
        <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div className="qdq-pop" style={{
            width: 80, height: 80, borderRadius: '50%', background: theme.success, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 40
          }}>✓</div>
          <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: theme.text, margin: 0 }}>
            Réponse envoyée
          </h2>
          <p style={{ color: theme.textSoft, marginTop: 12, marginBottom: 32, fontSize: 15 }}>
            En attente des autres joueurs...
          </p>
          <div style={{ padding: 20, background: theme.dark, borderRadius: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: theme.accentText, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Progression
            </div>
            <div className="qdq-display" style={{ fontSize: 48, fontWeight: 800, color: theme.darkIsLight ? theme.bg : theme.bg, lineHeight: 1 }}>
              {answeredIds.length}<span style={{ color: theme.textMuted }}>/{totalPlayers}</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {room.players.map(p => {
                const isTyping = room.typing?.[p.id] && !answeredIds.includes(p.id);
                return (
                  <div key={p.id} style={{ opacity: answeredIds.includes(p.id) ? 1 : 0.4, position: 'relative' }}>
                    <Avatar emoji={p.emoji} name={p.name} color={p.color} size={32} />
                    {isTyping && (
                      <div style={{
                        position: 'absolute', bottom: -4, right: -4,
                        background: theme.accentBg, borderRadius: '50%',
                        width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8
                      }}>✏️</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar emoji={me.emoji} name={me.name} color={me.color} size={32} />
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{me.name}</span>
        </div>
        <div style={{ fontSize: 13, color: theme.textSoft, fontWeight: 600 }}>
          {answeredIds.length}/{totalPlayers} ont répondu
        </div>
      </div>

      <div className="qdq-pop" style={{
        background: theme.accentBg, borderRadius: 24, padding: 32,
        marginBottom: 24, position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: 16, left: 20, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', opacity: 0.5
        }}>
          ✦ {needsBluff ? 'Mode Bluff' : 'La question'}
        </div>
        <p className="qdq-display" style={{
          fontSize: 28, fontWeight: 700, color: '#1a1a1a',
          lineHeight: 1.15, marginTop: 24, marginBottom: 0
        }}>
          {room.question}
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Ta vraie réponse 🔒
      </div>
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Ta vraie réponse..." maxLength={300} rows={3} autoFocus
        style={{ width: '100%', padding: '16px 18px', fontSize: 16,
          border: `1.5px solid ${theme.border}`, borderRadius: 14, background: theme.card,
          color: theme.text, resize: 'none', marginBottom: 16 }}/>

      {needsBluff && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🎭</span> Une fausse réponse (pour piéger)
          </div>
          <textarea value={bluff} onChange={(e) => setBluff(e.target.value)}
            placeholder="Invente une réponse crédible pour tromper les autres..." maxLength={300} rows={3}
            style={{ width: '100%', padding: '16px 18px', fontSize: 16,
              border: `1.5px solid ${theme.border}`, borderRadius: 14, background: theme.card,
              color: theme.text, resize: 'none', marginBottom: 8 }}/>
          <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16, lineHeight: 1.4 }}>
            Les vraies et fausses réponses seront mélangées. Si on croit que ta fausse réponse est vraie, tu gagnes des points !
          </p>
        </>
      )}

      <Button variant="primary" theme={theme} onClick={handleSubmit} disabled={!answer.trim() || (needsBluff && !bluff.trim())}>
        <Send size={16}/> Envoyer en secret
      </Button>

      <p style={{ textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 16, lineHeight: 1.5 }}>
        🔒 Personne ne verra tes réponses avant que tout le monde ait répondu.
      </p>
    </div>
  );
};

// ============ ÉCRAN "QUI EST LE PLUS..." ============
const MostLikelyScreen = ({ room, playerId, onSubmit, onLeave, onOpenSettings, theme }) => {
  const [selected, setSelected] = useState(null);
  const me = room.players.find(p => p.id === playerId);
  const myAnswer = room.answers?.[playerId];
  const answeredIds = Object.keys(room.answers || {}).filter(id => room.answers[id]?.real);

  if (myAnswer) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
        <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div className="qdq-pop" style={{
            width: 80, height: 80, borderRadius: '50%', background: theme.success, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 40
          }}>✓</div>
          <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: theme.text, margin: 0 }}>
            Vote envoyé
          </h2>
          <p style={{ color: theme.textSoft, marginTop: 12, fontSize: 15 }}>
            En attente des autres joueurs...
          </p>
          <div style={{ marginTop: 32, padding: 20, background: theme.dark, borderRadius: 16 }}>
            <div className="qdq-display" style={{ fontSize: 48, fontWeight: 800, color: theme.darkIsLight ? theme.bg : theme.bg, lineHeight: 1 }}>
              {answeredIds.length}<span style={{ color: theme.textMuted }}>/{room.players.length}</span>
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
              ont voté
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar emoji={me.emoji} name={me.name} color={me.color} size={32} />
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{me.name}</span>
        </div>
        <div style={{ fontSize: 13, color: theme.textSoft, fontWeight: 600 }}>
          {answeredIds.length}/{room.players.length} votes
        </div>
      </div>

      <div className="qdq-pop" style={{
        background: theme.purple, borderRadius: 24, padding: 32,
        marginBottom: 24, position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: 16, left: 20, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', color: 'white', opacity: 0.7
        }}>
          ✦ Vote secret
        </div>
        <p className="qdq-display" style={{
          fontSize: 26, fontWeight: 700, color: 'white',
          lineHeight: 1.2, marginTop: 24, marginBottom: 0
        }}>
          {room.question}
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Choisis un joueur
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
        gap: 8, marginBottom: 24
      }}>
        {room.players.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)} className="qdq-btn" style={{
            padding: '14px 6px',
            background: selected === p.id ? p.color : theme.card,
            border: selected === p.id ? `2px solid ${p.color}` : `1.5px solid ${theme.border}`,
            borderRadius: 14, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
          }}>
            <Avatar emoji={p.emoji} name={p.name} color={p.color} size={36} />
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: selected === p.id ? 'white' : theme.text,
              textAlign: 'center', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
            }}>
              {p.name}{p.id === playerId && ' (toi)'}
            </div>
          </button>
        ))}
      </div>

      <Button variant="accent" theme={theme} onClick={() => onSubmit(selected)} disabled={!selected}>
        {selected ? 'Valider mon vote' : 'Choisis un joueur'} <Send size={16}/>
      </Button>
      <p style={{ textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 12, lineHeight: 1.5 }}>
        🔒 Ton vote est secret.
      </p>
    </div>
  );
};

// ============ ÉCRAN DEVINER (CLASSIQUE) ============
const GuessScreenClassic = ({ room, playerId, onSubmit, onLeave, onOpenSettings, theme, soundEnabled }) => {
  const [guesses, setGuesses] = useState({});
  const [currentAnswerIdx, setCurrentAnswerIdx] = useState(0);
  const myGuesses = room.guesses?.[playerId];
  const hasGuessed = !!myGuesses;

  // Entries : uniquement les vraies réponses, sauf la mienne
  const shuffledAnswers = useMemo(() => {
    const entries = [];
    Object.entries(room.answers || {}).forEach(([pid, data]) => {
      if (data?.real && pid !== playerId) {
        entries.push({ answerId: pid, authorId: pid, text: data.real });
      }
    });
    const seed = room.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const arr = [...entries];
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [room.code, room.answers, playerId]);

  // Les autres joueurs (sans moi)
  const otherPlayers = room.players.filter(p => p.id !== playerId);

  const usedPlayerIds = Object.values(guesses);
  const currentAnswer = shuffledAnswers[currentAnswerIdx];
  const allAssigned = shuffledAnswers.every(a => guesses[a.answerId]);

  const handleAssign = (targetPlayerId) => {
    playSound(440, 60, soundEnabled);
    const newGuesses = { ...guesses };
    // En classique : chaque joueur ne peut être attribué qu'à une seule réponse
    Object.keys(newGuesses).forEach(aid => {
      if (newGuesses[aid] === targetPlayerId) delete newGuesses[aid];
    });
    newGuesses[currentAnswer.answerId] = targetPlayerId;
    setGuesses(newGuesses);

    const nextIdx = shuffledAnswers.findIndex((a, i) => i > currentAnswerIdx && !newGuesses[a.answerId]);
    if (nextIdx !== -1) setCurrentAnswerIdx(nextIdx);
    else {
      const firstUnassigned = shuffledAnswers.findIndex(a => !newGuesses[a.answerId]);
      if (firstUnassigned !== -1) setCurrentAnswerIdx(firstUnassigned);
    }
  };

  if (hasGuessed) {
    return <WaitingScreen room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} message="Devinettes envoyées" subtitle="En attente des autres..." icon="🔮" />;
  }

  if (shuffledAnswers.length === 0) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: theme.textSoft }}>Aucune réponse à deviner. Passons à la suite...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: theme.purple, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          ✦ À toi de deviner
        </div>
        <h2 className="qdq-display" style={{ fontSize: 26, fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.15 }}>
          Qui a dit quoi ?
        </h2>
        <p style={{ color: theme.textSoft, fontSize: 13, marginTop: 6 }}>
          Ta propre réponse est automatiquement masquée
        </p>
      </div>

      <div className="qdq-scrollbar" style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {shuffledAnswers.map((a, i) => (
          <button key={a.answerId} onClick={() => setCurrentAnswerIdx(i)} className="qdq-btn" style={{
            minWidth: 36, height: 36, borderRadius: 10,
            border: i === currentAnswerIdx ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
            background: guesses[a.answerId] ? theme.dark : theme.card,
            color: guesses[a.answerId] ? theme.accentText : theme.text,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: theme.displayFont
          }}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="qdq-pop" key={currentAnswerIdx} style={{
        background: theme.card, border: `2px solid ${theme.text}`, borderRadius: 20,
        padding: 24, marginBottom: 20, minHeight: 120,
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 11, color: theme.textSoft, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
          Réponse #{currentAnswerIdx + 1}
        </div>
        <p className="qdq-italic" style={{
          fontSize: 22, color: theme.text, margin: 0, lineHeight: 1.4
        }}>
          « {currentAnswer.text} »
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        C'est qui selon toi ?
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 8, marginBottom: 24
      }}>
        {otherPlayers.map(p => {
          const isAssignedHere = guesses[currentAnswer.answerId] === p.id;
          const isAssignedElsewhere = usedPlayerIds.includes(p.id) && !isAssignedHere;
          return (
            <button key={p.id} onClick={() => handleAssign(p.id)} className="qdq-btn" style={{
              padding: '12px 6px',
              background: isAssignedHere ? p.color : theme.card,
              border: isAssignedHere ? `2px solid ${p.color}` : `1.5px solid ${theme.border}`,
              borderRadius: 14, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              opacity: isAssignedElsewhere ? 0.4 : 1
            }}>
              <Avatar emoji={p.emoji} name={p.name} color={p.color} size={32} />
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: isAssignedHere ? 'white' : theme.text,
                textAlign: 'center', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
              }}>
                {p.name}
              </div>
            </button>
          );
        })}
      </div>

      <Button variant="accent" theme={theme} onClick={() => onSubmit(guesses)} disabled={!allAssigned}>
        {allAssigned ? <>Valider mes devinettes <Check size={18}/></> : `Encore ${shuffledAnswers.length - Object.keys(guesses).length} à deviner`}
      </Button>
    </div>
  );
};

// ============ ÉCRAN DEVINER (BLUFF - PHASE 1 : identifier les bluffs) ============
const GuessScreenBluffPhase1 = ({ room, playerId, onSubmit, onLeave, onOpenSettings, theme, soundEnabled }) => {
  const [markedAsBluff, setMarkedAsBluff] = useState(new Set());
  const myBluffGuesses = room.bluffGuesses?.[playerId];
  const hasSubmitted = !!myBluffGuesses;

  // Toutes les réponses SAUF les miennes (ni ma vraie ni mon bluff)
  const shuffledAnswers = useMemo(() => {
    const entries = [];
    Object.entries(room.answers || {}).forEach(([pid, data]) => {
      if (pid === playerId) return; // pas mes réponses
      if (data?.real) entries.push({ answerId: `real_${pid}`, authorId: pid, text: data.real, isBluff: false });
      if (data?.bluff) entries.push({ answerId: `bluff_${pid}`, authorId: pid, text: data.bluff, isBluff: true });
    });
    const seed = room.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const arr = [...entries];
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [room.code, room.answers, playerId]);

  const toggleBluff = (answerId) => {
    playSound(440, 60, soundEnabled);
    const next = new Set(markedAsBluff);
    if (next.has(answerId)) next.delete(answerId);
    else next.add(answerId);
    setMarkedAsBluff(next);
  };

  if (hasSubmitted) {
    return <WaitingScreen room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} message="Bluffs identifiés" subtitle="Phase 2 bientôt..." icon="🎭" />;
  }

  // Nombre de bluffs attendus = nombre de bluffs des AUTRES joueurs
  const expectedBluffCount = Object.entries(room.answers || {})
    .filter(([pid, data]) => pid !== playerId && data?.bluff).length;

  return (
    <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: theme.purple, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          🎭 Phase 1/2 · Démasquer les bluffs
        </div>
        <h2 className="qdq-display" style={{ fontSize: 26, fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.15 }}>
          Quelles réponses<br/><span className="qdq-italic" style={{ color: theme.purple }}>sont des bluffs ?</span>
        </h2>
        <p style={{ color: theme.textSoft, fontSize: 13, marginTop: 10, maxWidth: 360, margin: '10px auto 0' }}>
          Tape sur les réponses que tu penses fausses. Tu as marqué <strong style={{ color: theme.text }}>{markedAsBluff.size}</strong> bluff{markedAsBluff.size > 1 ? 's' : ''} sur <strong style={{ color: theme.text }}>{expectedBluffCount}</strong> attendus.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {shuffledAnswers.map((entry, i) => {
          const marked = markedAsBluff.has(entry.answerId);
          return (
            <button key={entry.answerId} onClick={() => toggleBluff(entry.answerId)} className="qdq-btn" style={{
              padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
              background: marked ? theme.purple + '15' : theme.card,
              border: `2px solid ${marked ? theme.purple : theme.border}`,
              borderRadius: 16, position: 'relative', width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: '50%',
                  background: marked ? theme.purple : 'transparent',
                  border: `2px solid ${marked ? theme.purple : theme.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 14, fontWeight: 700, marginTop: 2
                }}>
                  {marked ? '🎭' : ''}
                </div>
                <p className="qdq-italic" style={{
                  fontSize: 17, color: theme.text, margin: 0, lineHeight: 1.4, flex: 1
                }}>
                  « {entry.text} »
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Button variant="accent" theme={theme} onClick={() => onSubmit(Array.from(markedAsBluff))}>
        Valider mes choix <Check size={18}/>
      </Button>
      <p style={{ textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 12, lineHeight: 1.5 }}>
        Tu pourras marquer autant de bluffs que tu veux.
      </p>
    </div>
  );
};

// ============ ÉCRAN DEVINER (BLUFF - PHASE 2 : attribuer les vraies) ============
const GuessScreenBluffPhase2 = ({ room, playerId, onSubmit, onLeave, onOpenSettings, theme, soundEnabled }) => {
  const [guesses, setGuesses] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const myGuesses = room.guesses?.[playerId];
  const hasSubmitted = !!myGuesses;

  // Seulement les vraies réponses des autres joueurs
  const realAnswers = useMemo(() => {
    const entries = [];
    Object.entries(room.answers || {}).forEach(([pid, data]) => {
      if (pid !== playerId && data?.real) {
        entries.push({ answerId: pid, authorId: pid, text: data.real });
      }
    });
    const seed = room.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const arr = [...entries];
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [room.code, room.answers, playerId]);

  const otherPlayers = room.players.filter(p => p.id !== playerId);
  const usedIds = Object.values(guesses);
  const currentAnswer = realAnswers[currentIdx];
  const allAssigned = realAnswers.every(a => guesses[a.answerId]);

  const handleAssign = (targetPlayerId) => {
    playSound(440, 60, soundEnabled);
    const newGuesses = { ...guesses };
    Object.keys(newGuesses).forEach(aid => {
      if (newGuesses[aid] === targetPlayerId) delete newGuesses[aid];
    });
    newGuesses[currentAnswer.answerId] = targetPlayerId;
    setGuesses(newGuesses);

    const nextIdx = realAnswers.findIndex((a, i) => i > currentIdx && !newGuesses[a.answerId]);
    if (nextIdx !== -1) setCurrentIdx(nextIdx);
    else {
      const firstUnassigned = realAnswers.findIndex(a => !newGuesses[a.answerId]);
      if (firstUnassigned !== -1) setCurrentIdx(firstUnassigned);
    }
  };

  if (hasSubmitted) {
    return <WaitingScreen room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} message="Attributions envoyées" subtitle="En attente des autres..." icon="🔮" />;
  }

  if (realAnswers.length === 0) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: theme.textSoft }}>Aucune vraie réponse à attribuer.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          🎭 Phase 2/2 · Attribuer les vraies réponses
        </div>
        <h2 className="qdq-display" style={{ fontSize: 26, fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.15 }}>
          Qui a vraiment<br/><span className="qdq-italic" style={{ color: theme.accent }}>dit quoi ?</span>
        </h2>
        <p style={{ color: theme.textSoft, fontSize: 13, marginTop: 6 }}>
          Associe chaque vraie réponse à son auteur
        </p>
      </div>

      <div className="qdq-scrollbar" style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {realAnswers.map((a, i) => (
          <button key={a.answerId} onClick={() => setCurrentIdx(i)} className="qdq-btn" style={{
            minWidth: 36, height: 36, borderRadius: 10,
            border: i === currentIdx ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
            background: guesses[a.answerId] ? theme.dark : theme.card,
            color: guesses[a.answerId] ? theme.accentText : theme.text,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: theme.displayFont
          }}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="qdq-pop" key={currentIdx} style={{
        background: theme.card, border: `2px solid ${theme.text}`, borderRadius: 20,
        padding: 24, marginBottom: 20, minHeight: 120,
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 11, color: theme.textSoft, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
          Vraie réponse #{currentIdx + 1}
        </div>
        <p className="qdq-italic" style={{ fontSize: 22, color: theme.text, margin: 0, lineHeight: 1.4 }}>
          « {currentAnswer.text} »
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        C'est qui selon toi ?
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 8, marginBottom: 24
      }}>
        {otherPlayers.map(p => {
          const isAssignedHere = guesses[currentAnswer.answerId] === p.id;
          const isAssignedElsewhere = usedIds.includes(p.id) && !isAssignedHere;
          return (
            <button key={p.id} onClick={() => handleAssign(p.id)} className="qdq-btn" style={{
              padding: '12px 6px',
              background: isAssignedHere ? p.color : theme.card,
              border: isAssignedHere ? `2px solid ${p.color}` : `1.5px solid ${theme.border}`,
              borderRadius: 14, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              opacity: isAssignedElsewhere ? 0.4 : 1
            }}>
              <Avatar emoji={p.emoji} name={p.name} color={p.color} size={32} />
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: isAssignedHere ? 'white' : theme.text,
                textAlign: 'center', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
              }}>
                {p.name}
              </div>
            </button>
          );
        })}
      </div>

      <Button variant="accent" theme={theme} onClick={() => onSubmit(guesses)} disabled={!allAssigned}>
        {allAssigned ? <>Valider mes attributions <Check size={18}/></> : `Encore ${realAnswers.length - Object.keys(guesses).length} à attribuer`}
      </Button>
    </div>
  );
};

// ============ ÉCRAN ATTENTE ============
const WaitingScreen = ({ room, playerId, onLeave, onOpenSettings, theme, message, subtitle, icon = '⏳' }) => {
  const totalPlayers = room.players.length;
  const answeredCount = room.phase === 'guessing_bluff_p1'
    ? Object.keys(room.bluffGuesses || {}).length
    : Object.keys(room.guesses || {}).length;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
      <div style={{ textAlign: 'center' }}>
      <div className="qdq-pop" style={{
        width: 80, height: 80, borderRadius: '50%', background: theme.purple, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '30px auto 24px', fontSize: 36
      }}>{icon}</div>
      <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: theme.text, margin: 0 }}>
        {message}
      </h2>
      <p style={{ color: theme.textSoft, marginTop: 12, fontSize: 15 }}>{subtitle}</p>
      <div style={{ marginTop: 32, padding: 20, background: theme.dark, borderRadius: 16 }}>
        <div className="qdq-display" style={{ fontSize: 48, fontWeight: 800, color: theme.darkIsLight ? theme.bg : theme.bg, lineHeight: 1 }}>
          {answeredCount}<span style={{ color: theme.textMuted }}>/{totalPlayers}</span>
        </div>
      </div>
      </div>
    </div>
  );
};

// ============ ÉCRAN RÉSULTATS ============
const ResultsScreen = ({ room, playerId, onNext, onLeave, onEndGame, onOpenSettings, theme, soundEnabled }) => {
  const [revealIdx, setRevealIdx] = useState(-1);
  const isHost = room.hostId === playerId;
  const mode = room.settings?.questionMode || 'classic';

  const shuffledEntries = useMemo(() => {
    const entries = [];
    Object.entries(room.answers || {}).forEach(([pid, data]) => {
      if (data?.real) entries.push({ answerId: `real_${pid}`, authorId: pid, text: data.real, isBluff: false });
      if (data?.bluff) entries.push({ answerId: `bluff_${pid}`, authorId: pid, text: data.bluff, isBluff: true });
    });
    const seed = room.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const arr = [...entries];
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [room.code, room.answers]);

  const mostLikelyVotes = useMemo(() => {
    if (mode !== 'mostLikely') return null;
    const tally = {};
    Object.entries(room.answers || {}).forEach(([voterId, data]) => {
      const targetId = data?.real;
      if (targetId) tally[targetId] = (tally[targetId] || 0) + 1;
    });
    return tally;
  }, [room.answers, mode]);

  useEffect(() => {
    if (mode === 'mostLikely') { setRevealIdx(999); return; }
    if (revealIdx < shuffledEntries.length - 1) {
      const t = setTimeout(() => {
        setRevealIdx(i => i + 1);
        playSound(550 + (revealIdx + 1) * 50, 150, soundEnabled);
      }, revealIdx === -1 ? 500 : 1200);
      return () => clearTimeout(t);
    } else if (revealIdx === shuffledEntries.length - 1 && shuffledEntries.length > 0) {
      setTimeout(() => launchConfetti(theme), 300);
      playChord([523, 659, 784], 400, soundEnabled);
    }
  }, [revealIdx, shuffledEntries.length, mode]);

  const roundScores = useMemo(() => {
    const scores = {};
    room.players.forEach(p => scores[p.id] = 0);
    if (mode === 'mostLikely') return scores;

    if (mode === 'bluff') {
      // Phase 1 : bluffs identifiés correctement
      Object.entries(room.bluffGuesses || {}).forEach(([guesserId, markedIds]) => {
        const markedSet = new Set(markedIds);
        shuffledEntries.forEach(entry => {
          if (entry.authorId === guesserId) return; // pas ses propres réponses
          const wasMarked = markedSet.has(entry.answerId);
          if (entry.isBluff && wasMarked) {
            // +2 pour avoir identifié un bluff
            scores[guesserId] = (scores[guesserId] || 0) + 2;
          }
          if (entry.isBluff && !wasMarked && guesserId !== entry.authorId) {
            // Crédulité : le bluffeur gagne 1 point
            scores[entry.authorId] = (scores[entry.authorId] || 0) + 1;
          }
        });
      });
      // Phase 2 : vraies réponses correctement attribuées
      Object.entries(room.guesses || {}).forEach(([guesserId, guessMap]) => {
        Object.entries(guessMap).forEach(([answerId, guessedPlayerId]) => {
          if (answerId === guessedPlayerId) {
            scores[guesserId] = (scores[guesserId] || 0) + 1;
          }
        });
      });
    } else {
      // Mode classique
      Object.entries(room.guesses || {}).forEach(([guesserId, guessMap]) => {
        Object.entries(guessMap).forEach(([answerId, guessedPlayerId]) => {
          if (answerId === guessedPlayerId) {
            scores[guesserId] = (scores[guesserId] || 0) + 1;
          }
        });
      });
    }
    return scores;
  }, [room.guesses, room.bluffGuesses, room.players, shuffledEntries, mode]);

  const totalScores = useMemo(() => {
    const totals = { ...(room.settings?.totalScores || {}) };
    room.players.forEach(p => {
      totals[p.id] = (totals[p.id] || 0) + (roundScores[p.id] || 0);
    });
    return totals;
  }, [room.settings?.totalScores, roundScores, room.players]);

  const sortedPlayers = [...room.players].sort((a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0));
  const allRevealed = revealIdx >= shuffledEntries.length - 1 || mode === 'mostLikely';

  const currentRound = room.settings?.currentRound || 1;
  const totalRounds = room.settings?.totalRounds || 0;
  const isLastRound = totalRounds > 0 && currentRound >= totalRounds;

  // Mode "Qui est le plus..."
  if (mode === 'mostLikely') {
    const sortedVotes = Object.entries(mostLikelyVotes || {}).sort((a, b) => b[1] - a[1]);
    const maxVotes = sortedVotes[0]?.[1] || 0;

    return (
      <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
        <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: theme.purple, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            ✦ Résultats du vote
          </div>
          <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: theme.text, margin: 0 }}>
            Le verdict...
          </h2>
        </div>

        <div style={{ background: theme.purple, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'white', opacity: 0.7, marginBottom: 4 }}>
            La question
          </div>
          <p className="qdq-display" style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.3 }}>
            {room.question}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {sortedVotes.map(([pid, votes], i) => {
            const player = room.players.find(p => p.id === pid);
            if (!player) return null;
            const isWinner = votes === maxVotes && i === 0;
            return (
              <div key={pid} className="qdq-fadeup" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                background: isWinner ? theme.accentBg + '30' : theme.card,
                border: isWinner ? `2px solid ${theme.accent}` : `1.5px solid ${theme.border}`,
                borderRadius: 16, animationDelay: `${i * 0.1}s`
              }}>
                {isWinner && <div style={{ fontSize: 24 }}>👑</div>}
                <Avatar emoji={player.emoji} name={player.name} color={player.color} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textSoft }}>
                    {votes} vote{votes > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="qdq-display" style={{ fontSize: 28, fontWeight: 800, color: theme.accent }}>
                  {votes}
                </div>
              </div>
            );
          })}
          {/* Joueurs sans vote */}
          {room.players.filter(p => !mostLikelyVotes?.[p.id]).map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 14,
              background: theme.card, border: `1.5px solid ${theme.border}`,
              borderRadius: 16, opacity: 0.5
            }}>
              <Avatar emoji={p.emoji} name={p.name} color={p.color} size={40} />
              <div style={{ flex: 1, fontSize: 16, fontWeight: 500, color: theme.textSoft }}>
                {p.name}
              </div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>0 vote</div>
            </div>
          ))}
        </div>

        <EndButtons isHost={isHost} isLastRound={isLastRound}
          onNext={() => onNext(totalScores)}
          onEndGame={() => onEndGame(totalScores)}
          onLeave={onLeave}
          hostName={room.players.find(p => p.id === room.hostId)?.name}
          theme={theme} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={true} />
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          ✦ Révélations {mode === 'bluff' && '· Mode Bluff'}
        </div>
        <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: theme.text, margin: 0 }}>
          Et la vérité...
        </h2>
        {totalRounds > 0 && (
          <p style={{ color: theme.textSoft, fontSize: 13, marginTop: 6 }}>
            Manche {currentRound}/{totalRounds}
          </p>
        )}
      </div>

      <div style={{ background: theme.accentBg, borderRadius: 16, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', opacity: 0.6, marginBottom: 4 }}>
          La question
        </div>
        <p className="qdq-display" style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>
          {room.question}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {shuffledEntries.map((entry, i) => {
          const revealed = i <= revealIdx;
          const author = room.players.find(p => p.id === entry.authorId);

          // Comptage des bonnes devinettes selon le mode
          let correctCount = 0;
          let totalGuessers = 0;

          if (mode === 'bluff') {
            if (entry.isBluff) {
              // Bluff : ceux qui l'ont démasqué
              Object.entries(room.bluffGuesses || {}).forEach(([gid, marks]) => {
                if (gid === entry.authorId) return;
                totalGuessers++;
                if (marks.includes(entry.answerId)) correctCount++;
              });
            } else {
              // Vraie réponse : ceux qui l'ont attribuée au bon auteur
              Object.entries(room.guesses || {}).forEach(([gid, gmap]) => {
                if (gid === entry.authorId) return;
                totalGuessers++;
                if (gmap[entry.authorId] === entry.authorId) correctCount++;
              });
            }
          } else {
            // Mode classique
            Object.entries(room.guesses || {}).forEach(([gid, gmap]) => {
              if (gid === entry.authorId) return;
              totalGuessers++;
              if (gmap[entry.authorId] === entry.authorId) correctCount++;
            });
          }

          return (
            <div key={entry.answerId} style={{
              background: revealed ? theme.card : theme.dark,
              border: revealed ? `2px solid ${entry.isBluff ? theme.purple : (author?.color || theme.text)}` : `2px solid ${theme.text}`,
              borderRadius: 18, padding: 18, transition: 'all 0.5s ease',
              position: 'relative',
              ...(revealed && i === revealIdx ? { animation: 'qdq-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' } : {})
            }}>
              {revealed && entry.isBluff && (
                <div style={{
                  position: 'absolute', top: -10, right: 12,
                  background: theme.purple, color: 'white',
                  fontSize: 10, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 100,
                  letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>
                  🎭 Bluff
                </div>
              )}
              <p className="qdq-italic" style={{
                fontSize: 18, color: revealed ? theme.text : (theme.darkIsLight ? theme.bg : theme.bg),
                margin: '0 0 14px 0', lineHeight: 1.4
              }}>
                « {entry.text} »
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 12, borderTop: `1px solid ${revealed ? theme.border : theme.borderDark}`
              }}>
                {revealed && author ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar emoji={author.emoji} name={author.name} color={author.color} size={32} />
                      <div>
                        <div style={{ fontSize: 11, color: theme.textSoft, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {entry.isBluff ? 'Bluff de' : "C'était"}
                        </div>
                        <div className="qdq-display" style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>
                          {author.name}
                        </div>
                      </div>
                    </div>
                    {totalGuessers > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: theme.textSoft, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {entry.isBluff ? 'Démasqué' : 'Trouvé'}
                        </div>
                        <div className="qdq-display" style={{ fontSize: 18, fontWeight: 700, color: correctCount > 0 ? theme.success : theme.accent }}>
                          {correctCount}/{totalGuessers}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="qdq-pulse" style={{ color: theme.accentText, fontSize: 13, fontWeight: 600, textAlign: 'center', width: '100%' }}>
                    <Eye size={14} style={{ verticalAlign: 'middle', marginRight: 6 }}/>
                    Révélation imminente...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <div className="qdq-fadeup">
          <div style={{ background: theme.dark, borderRadius: 20, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Trophy size={18} color={theme.accentBg} />
              <div style={{ fontSize: 12, color: theme.accentText, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Classement
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedPlayers.map((p, i) => (
                <div key={p.id} className="qdq-fadeup" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: i === 0 ? theme.accentBg + '30' : 'rgba(255,255,255,0.05)',
                  borderRadius: 12, animationDelay: `${i * 0.1}s`
                }}>
                  <div className="qdq-display" style={{
                    width: 26, textAlign: 'center', fontSize: 20, fontWeight: 800,
                    color: i === 0 ? theme.accentBg : theme.textMuted
                  }}>
                    {i + 1}
                  </div>
                  <Avatar emoji={p.emoji} name={p.name} color={p.color} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.darkIsLight ? theme.bg : theme.bg }}>
                      {p.name}
                      {p.id === playerId && <span style={{ color: theme.textMuted, fontWeight: 400 }}> (toi)</span>}
                    </div>
                    {roundScores[p.id] > 0 && (
                      <div style={{ fontSize: 11, color: theme.success, fontWeight: 600 }}>
                        +{roundScores[p.id]} cette manche
                      </div>
                    )}
                  </div>
                  <div className="qdq-display" style={{ fontSize: 24, fontWeight: 800, color: theme.accentBg }}>
                    {totalScores[p.id] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <EndButtons isHost={isHost} isLastRound={isLastRound}
            onNext={() => onNext(totalScores)}
            onEndGame={() => onEndGame(totalScores)}
            onLeave={onLeave}
            hostName={room.players.find(p => p.id === room.hostId)?.name}
            theme={theme} />
        </div>
      )}
    </div>
  );
};

const EndButtons = ({ isHost, isLastRound, onNext, onEndGame, onLeave, hostName, theme }) => (
  <>
    {isHost ? (
      isLastRound ? (
        <Button variant="accent" theme={theme} onClick={onEndGame}>
          <Trophy size={18}/> Voir la fin de partie
        </Button>
      ) : (
        <Button variant="accent" theme={theme} onClick={onNext}>
          <RotateCcw size={18}/> Manche suivante
        </Button>
      )
    ) : (
      <div style={{
        padding: 20, background: theme.card, borderRadius: 14,
        textAlign: 'center', border: `1.5px dashed ${theme.borderDark}`
      }}>
        <div className="qdq-pulse" style={{ fontSize: 14, color: theme.textSoft }}>
          En attente de <strong style={{ color: theme.text }}>{hostName}</strong>...
        </div>
      </div>
    )}
    <button onClick={onLeave} className="qdq-btn" style={{
      background: 'transparent', border: 'none', color: theme.textSoft,
      fontSize: 13, cursor: 'pointer', padding: 12, width: '100%', marginTop: 8
    }}>
      Quitter le salon
    </button>
  </>
);

// ============ ÉCRAN FIN DE PARTIE ============
const EndGameScreen = ({ room, playerId, onReplay, onLeave, onOpenSettings, theme, soundEnabled }) => {
  const totalScores = room.settings?.totalScores || {};
  const sortedPlayers = [...room.players].sort((a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0));
  const winner = sortedPlayers[0];
  const isHost = room.hostId === playerId;

  useEffect(() => {
    setTimeout(() => launchConfetti(theme), 300);
    setTimeout(() => launchConfetti(theme), 1000);
    playChord([523, 659, 784, 1047], 600, soundEnabled);
  }, []);

  return (
    <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <TopBar room={room} playerId={playerId} onLeave={onLeave} onOpenSettings={onOpenSettings} theme={theme} showPhase={false} />
      <div className="qdq-pop" style={{ textAlign: 'center', marginTop: 10, marginBottom: 32 }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
        <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          Partie terminée
        </div>
        <h2 className="qdq-display" style={{ fontSize: 44, fontWeight: 800, color: theme.text, margin: 0, lineHeight: 1 }}>
          Grand<br/>
          <span className="qdq-italic" style={{ color: theme.accent }}>vainqueur</span>
        </h2>
      </div>

      {winner && (
        <div className="qdq-pop" style={{
          background: theme.dark, borderRadius: 24, padding: 32,
          textAlign: 'center', marginBottom: 24, position: 'relative', overflow: 'hidden'
        }}>
          <div className="qdq-grain" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Avatar emoji={winner.emoji} name={winner.name} color={winner.color} size={80} />
            </div>
            <div className="qdq-display" style={{ fontSize: 36, fontWeight: 800, color: theme.darkIsLight ? theme.bg : theme.bg, marginBottom: 4 }}>
              {winner.name}
            </div>
            <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 16 }}>
              gagne avec
            </div>
            <div className="qdq-display" style={{ fontSize: 64, fontWeight: 800, color: theme.accentBg, lineHeight: 1 }}>
              {totalScores[winner.id] || 0}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>
              points
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Classement final
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className="qdq-fadeup" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: theme.card, borderRadius: 14,
              border: `1.5px solid ${i === 0 ? theme.accent : theme.border}`,
              animationDelay: `${i * 0.1}s`
            }}>
              <div className="qdq-display" style={{
                width: 26, textAlign: 'center', fontSize: 20, fontWeight: 800,
                color: i === 0 ? theme.accent : theme.textMuted
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <Avatar emoji={p.emoji} name={p.name} color={p.color} size={34} />
              <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: theme.text }}>
                {p.name}
              </div>
              <div className="qdq-display" style={{ fontSize: 22, fontWeight: 800, color: theme.accent }}>
                {totalScores[p.id] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="accent" theme={theme} onClick={onReplay}>
            <RotateCcw size={18}/> Nouvelle partie (même équipe)
          </Button>
          <Button variant="secondary" theme={theme} onClick={onLeave}>
            Quitter le salon
          </Button>
        </div>
      ) : (
        <div style={{
          padding: 20, background: theme.card, borderRadius: 14,
          textAlign: 'center', border: `1.5px dashed ${theme.borderDark}`
        }}>
          <div className="qdq-pulse" style={{ fontSize: 14, color: theme.textSoft }}>
            En attente de l'hôte...
          </div>
          <button onClick={onLeave} className="qdq-btn" style={{
            background: 'transparent', border: 'none', color: theme.textSoft,
            fontSize: 13, cursor: 'pointer', padding: 12, marginTop: 8
          }}>
            Quitter
          </button>
        </div>
      )}
    </div>
  );
};

// ============ APP PRINCIPALE ============
export default function App() {
  const [playerId] = useState(() => generatePlayerId());
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [themeName, setThemeName] = useState(() => localStorage.getItem('qdq_theme') || 'classique');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('qdq_sound') !== 'false');
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('qdq_notif') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const unsubRef = useRef(null);
  const prevPhaseRef = useRef(null);
  const theme = THEMES[themeName];

  useEffect(() => { localStorage.setItem('qdq_theme', themeName); }, [themeName]);
  useEffect(() => { localStorage.setItem('qdq_sound', soundEnabled); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('qdq_notif', notifEnabled); }, [notifEnabled]);

  // Reconnexion auto
  useEffect(() => {
    const session = loadLocalSession();
    if (session?.roomCode && session?.playerId === playerId) {
      (async () => {
        const r = await storage.getRoom(session.roomCode);
        if (r && r.players.find(p => p.id === playerId)) {
          setRoomCode(session.roomCode);
          setRoom(r);
        } else {
          clearLocalSession();
        }
      })();
    }
  }, [playerId]);

  useEffect(() => {
    if (!roomCode) return;
    saveLocalSession({ roomCode, playerId });
    unsubRef.current = storage.subscribeRoom(roomCode, (r) => {
      if (r) setRoom(r);
      else { setRoom(null); setRoomCode(null); clearLocalSession(); }
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [roomCode]);

  useEffect(() => {
    if (!room) return;
    const prevPhase = prevPhaseRef.current;
    const currPhase = room.phase;
    if (prevPhase && prevPhase !== currPhase) {
      if (currPhase === 'answering' && prevPhase === 'lobby') {
        playSound(700, 150, soundEnabled);
        vibrate([100, 50, 100], soundEnabled);
        if (notifEnabled && document.hidden) {
          flashTitle('À toi de répondre !');
          sendPushNotification('Qui a dit quoi', 'La partie commence, à toi de répondre !');
        }
      }
      if ((currPhase === 'guessing' || currPhase === 'guessing_bluff_p1') && prevPhase === 'answering') {
        playSound(500, 150, soundEnabled);
        vibrate([100, 50, 100], soundEnabled);
        if (notifEnabled && document.hidden) {
          flashTitle('À toi de deviner !');
          sendPushNotification('Qui a dit quoi', 'Toutes les réponses sont là !');
        }
      }
      if (currPhase === 'results') {
        playChord([440, 554, 659], 300, soundEnabled);
        vibrate([50, 30, 50, 30, 100], soundEnabled);
        if (notifEnabled && document.hidden) {
          flashTitle('Résultats !');
          sendPushNotification('Qui a dit quoi', 'Place aux révélations !');
        }
      }
    }
    prevPhaseRef.current = currPhase;
  }, [room?.phase, playerId, soundEnabled, notifEnabled]);

  const updateRoom = async (updater) => {
    const current = await storage.getRoom(roomCode);
    if (!current) return;
    const updated = typeof updater === 'function' ? updater(current) : updater;
    await storage.setRoom(roomCode, updated);
  };

  const handleCreate = async (name, emoji) => {
    let code;
    let attempt = 0;
    while (attempt < 10) {
      code = generateRoomCode();
      const existing = await storage.getRoom(code);
      if (!existing) break;
      attempt++;
    }
    const color = AVATAR_COLORS[0];
    const newRoom = {
      code, hostId: playerId, phase: 'lobby',
      players: [{ id: playerId, name, emoji, color }],
      question: null, answers: {}, guesses: {}, bluffGuesses: {}, typing: {},
      settings: { totalScores: {}, currentRound: 0, totalRounds: 0, questionMode: 'classic' },
      createdAt: Date.now()
    };
    await storage.setRoom(code, newRoom);
    setRoomCode(code);
    setRoom(newRoom);
  };

  const handleJoin = async (name, code, emoji) => {
    const existing = await storage.getRoom(code);
    if (!existing) return false;
    if (existing.phase !== 'lobby') {
      const existingPlayer = existing.players.find(p => p.id === playerId);
      if (existingPlayer) {
        setRoomCode(code);
        setRoom(existing);
        return true;
      }
      return false;
    }
    if (existing.players.length >= 12) return false;
    existing.players = existing.players.filter(p => p.id !== playerId);
    if (existing.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      name = `${name}_${Math.floor(Math.random() * 99)}`;
    }
    const color = AVATAR_COLORS[existing.players.length % AVATAR_COLORS.length];
    existing.players.push({ id: playerId, name, emoji, color });
    await storage.setRoom(code, existing);
    setRoomCode(code);
    setRoom(existing);
    return true;
  };

  const handleStart = async (question, questionMode, totalRounds) => {
    await updateRoom(r => {
      const gameInProgress = (r.settings?.currentRound || 0) > 0;
      return {
        ...r, phase: 'answering', question,
        answers: {}, guesses: {}, bluffGuesses: {}, typing: {},
        settings: {
          ...(r.settings || {}),
          // Le mode est verrouillé après le début
          questionMode: gameInProgress ? r.settings.questionMode : questionMode,
          totalRounds: gameInProgress ? r.settings.totalRounds : (totalRounds || 0),
          currentRound: (r.settings?.currentRound || 0) + 1
        }
      };
    });
  };

  const handleUpdateTotalRounds = async (newTotalRounds) => {
    await updateRoom(r => ({
      ...r,
      settings: { ...(r.settings || {}), totalRounds: newTotalRounds }
    }));
  };

  const handleSubmitAnswer = async (answer, bluff) => {
    const latest = await storage.getRoom(roomCode);
    if (!latest) return;
    latest.answers = { ...(latest.answers || {}), [playerId]: { real: answer, bluff } };
    latest.typing = { ...(latest.typing || {}), [playerId]: false };
    if (Object.keys(latest.answers).length === latest.players.length) {
      const mode = latest.settings?.questionMode;
      if (mode === 'bluff') latest.phase = 'guessing_bluff_p1';
      else if (mode === 'mostLikely') latest.phase = 'results';
      else latest.phase = 'guessing';
    }
    await storage.setRoom(roomCode, latest);
  };

  const handleSubmitBluffGuesses = async (markedAnswerIds) => {
    const latest = await storage.getRoom(roomCode);
    if (!latest) return;
    latest.bluffGuesses = { ...(latest.bluffGuesses || {}), [playerId]: markedAnswerIds };
    if (Object.keys(latest.bluffGuesses).length === latest.players.length) {
      latest.phase = 'guessing_bluff_p2';
    }
    await storage.setRoom(roomCode, latest);
  };

  const handleSubmitGuesses = async (guesses) => {
    const latest = await storage.getRoom(roomCode);
    if (!latest) return;
    latest.guesses = { ...(latest.guesses || {}), [playerId]: guesses };
    if (Object.keys(latest.guesses).length === latest.players.length) {
      latest.phase = 'results';
    }
    await storage.setRoom(roomCode, latest);
  };

  const handleTyping = async (isTyping) => {
    if (!roomCode) return;
    const latest = await storage.getRoom(roomCode);
    if (!latest) return;
    if ((latest.typing?.[playerId] || false) === isTyping) return;
    latest.typing = { ...(latest.typing || {}), [playerId]: isTyping };
    await storage.setRoom(roomCode, latest);
  };

  const handleNextRound = async (newTotalScores) => {
    await updateRoom(r => ({
      ...r, phase: 'lobby', question: null,
      answers: {}, guesses: {}, bluffGuesses: {}, typing: {},
      settings: { ...(r.settings || {}), totalScores: newTotalScores }
    }));
  };

  const handleEndGame = async (finalScores) => {
    await updateRoom(r => ({
      ...r, phase: 'endgame',
      settings: { ...(r.settings || {}), totalScores: finalScores }
    }));
  };

  const handleReplay = async () => {
    await updateRoom(r => ({
      ...r, phase: 'lobby', question: null,
      answers: {}, guesses: {}, bluffGuesses: {}, typing: {},
      settings: { ...(r.settings || {}), totalScores: {}, currentRound: 0, totalRounds: 0 }
    }));
  };

  const handleKick = async (targetPlayerId) => {
    const latest = await storage.getRoom(roomCode);
    if (!latest) return;
    latest.players = latest.players.filter(p => p.id !== targetPlayerId);
    await storage.setRoom(roomCode, latest);
  };

  const handleLeave = async () => {
    if (room && roomCode) {
      const latest = await storage.getRoom(roomCode);
      if (latest) {
        latest.players = latest.players.filter(p => p.id !== playerId);
        if (latest.players.length > 0 && latest.hostId === playerId) {
          latest.hostId = latest.players[0].id;
        }
        await storage.setRoom(roomCode, latest);
      }
    }
    clearLocalSession();
    setRoomCode(null);
    setRoom(null);
    setShowLeaveConfirm(false);
  };

  // Demande de confirmation avant de quitter (sauf depuis le lobby où on quitte directement)
  const handleAskLeave = () => {
    if (!room || room.phase === 'lobby') {
      handleLeave();
    } else {
      setShowLeaveConfirm(true);
    }
  };

  return (
    <div className="qdq-root" style={{
      minHeight: '100vh', background: theme.bg, color: theme.text,
      position: 'relative', overflow: 'hidden'
    }}>
      <GlobalStyles theme={theme} />
      <div className="qdq-grain" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {!roomCode || !room ? (
          <HomeScreen onCreate={handleCreate} onJoin={handleJoin} theme={theme}
            onOpenSettings={() => setShowSettings(true)} />
        ) : room.phase === 'lobby' ? (
          <LobbyScreen room={room} playerId={playerId} onStart={handleStart}
            onLeave={handleLeave} onKick={handleKick}
            onUpdateTotalRounds={handleUpdateTotalRounds}
            theme={theme} onOpenSettings={() => setShowSettings(true)}
            soundEnabled={soundEnabled} />
        ) : room.phase === 'answering' ? (
          <AnswerScreen room={room} playerId={playerId} onSubmit={handleSubmitAnswer}
            onTyping={handleTyping} onLeave={handleAskLeave}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme} soundEnabled={soundEnabled} />
        ) : room.phase === 'guessing' ? (
          <GuessScreenClassic room={room} playerId={playerId}
            onSubmit={handleSubmitGuesses} onLeave={handleAskLeave}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme} soundEnabled={soundEnabled} />
        ) : room.phase === 'guessing_bluff_p1' ? (
          <GuessScreenBluffPhase1 room={room} playerId={playerId}
            onSubmit={handleSubmitBluffGuesses} onLeave={handleAskLeave}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme} soundEnabled={soundEnabled} />
        ) : room.phase === 'guessing_bluff_p2' ? (
          <GuessScreenBluffPhase2 room={room} playerId={playerId}
            onSubmit={handleSubmitGuesses} onLeave={handleAskLeave}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme} soundEnabled={soundEnabled} />
        ) : room.phase === 'results' ? (
          <ResultsScreen room={room} playerId={playerId}
            onNext={handleNextRound} onEndGame={handleEndGame} onLeave={handleAskLeave}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme} soundEnabled={soundEnabled} />
        ) : room.phase === 'endgame' ? (
          <EndGameScreen room={room} playerId={playerId} onReplay={handleReplay}
            onLeave={handleAskLeave} onOpenSettings={() => setShowSettings(true)}
            theme={theme} soundEnabled={soundEnabled} />
        ) : null}
      </div>
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} theme={theme}
          themeName={themeName} setThemeName={setThemeName}
          soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
          notifEnabled={notifEnabled} setNotifEnabled={setNotifEnabled} />
      )}
      {showLeaveConfirm && (
        <ConfirmLeaveModal theme={theme}
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)} />
      )}
    </div>
  );
}
