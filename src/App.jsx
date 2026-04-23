import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Send, Eye, Trophy, ArrowRight, Copy, Check, Sparkles, RotateCcw, Crown } from 'lucide-react';
import { storage } from './firebase.js';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generatePlayerId = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const AVATAR_COLORS = [
  '#E94F37', '#F5B841', '#4CB944', '#3D5A80', '#9B5DE5',
  '#F15BB5', '#00BBF9', '#FB8500', '#8338EC', '#06A77D',
  '#E63946', '#457B9D'
];

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,600&family=DM+Sans:wght@400;500;700&display=swap');
    .qdq-root * { font-family: 'DM Sans', -apple-system, sans-serif; box-sizing: border-box; }
    .qdq-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
    .qdq-italic { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 600; }
    @keyframes qdq-fadeup { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes qdq-pop { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.03); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes qdq-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .qdq-fadeup { animation: qdq-fadeup 0.4s ease-out both; }
    .qdq-pop { animation: qdq-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .qdq-pulse { animation: qdq-pulse 1.8s ease-in-out infinite; }
    .qdq-btn { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
    .qdq-btn:active { transform: translateY(1px) scale(0.98); }
    .qdq-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .qdq-grain {
      background-image:
        radial-gradient(circle at 20% 30%, rgba(233, 79, 55, 0.08), transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(155, 93, 229, 0.08), transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(245, 184, 65, 0.05), transparent 60%);
    }
    input, textarea { font-family: 'DM Sans', sans-serif; }
    input:focus, textarea:focus { outline: none; border-color: #1a1a1a !important; }
    .qdq-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .qdq-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .qdq-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 2px; }
  `}</style>
);

const Avatar = ({ name, color, size = 40 }) => (
  <div className="qdq-display" style={{
    width: size, height: size, borderRadius: '50%', background: color, color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
  }}>
    {name.slice(0, 1).toUpperCase()}
  </div>
);

const Button = ({ children, onClick, disabled, variant = 'primary', style = {}, fullWidth = true }) => {
  const variants = {
    primary: { background: '#1a1a1a', color: '#faf7f2', border: 'none' },
    secondary: { background: 'transparent', color: '#1a1a1a', border: '1.5px solid #1a1a1a' },
    accent: { background: '#E94F37', color: 'white', border: 'none' }
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

const HomeScreen = ({ onCreate, onJoin }) => {
  const [mode, setMode] = useState('home');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return setError('Entre ton prénom');
    setLoading(true); setError('');
    await onCreate(name.trim());
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError('Entre ton prénom');
    if (code.length !== 5) return setError('Le code fait 5 caractères');
    setLoading(true); setError('');
    const ok = await onJoin(name.trim(), code.toUpperCase());
    if (!ok) setError('Salon introuvable ou partie déjà commencée');
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div className="qdq-fadeup" style={{ textAlign: 'center', marginTop: 40, marginBottom: 48 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', background: '#1a1a1a',
          color: '#F5B841', borderRadius: 100, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20
        }}>
          ✦ Jeu entre amis
        </div>
        <h1 className="qdq-display" style={{
          fontSize: 64, fontWeight: 800, margin: 0, lineHeight: 0.95, color: '#1a1a1a'
        }}>
          Qui a dit<br/>
          <span className="qdq-italic" style={{ color: '#E94F37' }}>quoi ?</span>
        </h1>
        <p style={{ marginTop: 16, color: '#6b655c', fontSize: 16, lineHeight: 1.5, maxWidth: 320, margin: '16px auto 0' }}>
          Une question. Tout le monde répond en secret. Devinez qui a dit quoi.
        </p>
      </div>

      {mode === 'home' && (
        <div className="qdq-fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="primary" onClick={() => setMode('create')}>
            <Plus size={18} /> Créer un salon
          </Button>
          <Button variant="secondary" onClick={() => setMode('join')}>
            <ArrowRight size={18} /> Rejoindre un salon
          </Button>
        </div>
      )}

      {mode !== 'home' && (
        <div className="qdq-fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, display: 'block' }}>
              Ton prénom
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Alex" maxLength={20}
              style={{ width: '100%', padding: '16px 18px', fontSize: 16,
                border: '1.5px solid #e5e0d8', borderRadius: 14, background: '#faf7f2' }}/>
          </div>

          {mode === 'join' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, display: 'block' }}>
                Code du salon
              </label>
              <input type="text" value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="ABCDE" maxLength={5}
                style={{ width: '100%', padding: '16px 18px', fontSize: 22, fontWeight: 700,
                  letterSpacing: '0.3em', textAlign: 'center',
                  border: '1.5px solid #e5e0d8', borderRadius: 14, background: '#faf7f2',
                  fontFamily: 'Fraunces, serif' }}/>
            </div>
          )}

          {error && <div style={{ color: '#E94F37', fontSize: 14, textAlign: 'center' }}>{error}</div>}

          <Button variant="accent" onClick={mode === 'create' ? handleCreate : handleJoin} disabled={loading}>
            {loading ? 'Connexion...' : (mode === 'create' ? 'Créer le salon' : 'Rejoindre')}
          </Button>

          <button onClick={() => { setMode('home'); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#6b655c',
              fontSize: 14, cursor: 'pointer', padding: 8 }}>
            ← Retour
          </button>
        </div>
      )}

      <div style={{ marginTop: 60, textAlign: 'center', color: '#a8a299', fontSize: 12, lineHeight: 1.6 }}>
        <p>Les salons sont partagés entre tous les joueurs.<br/>Partagez le code avec vos amis.</p>
      </div>
    </div>
  );
};

const LobbyScreen = ({ room, playerId, onStart, onLeave }) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;
  const [question, setQuestion] = useState('');

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const suggestions = [
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

  const pickRandom = () => setQuestion(suggestions[Math.floor(Math.random() * suggestions.length)]);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={onLeave} style={{
          background: 'transparent', border: 'none', color: '#6b655c',
          fontSize: 14, cursor: 'pointer', padding: 4
        }}>← Quitter</button>
        <div style={{ fontSize: 12, color: '#6b655c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Salon
        </div>
      </div>

      <div className="qdq-pop" style={{
        background: '#1a1a1a', borderRadius: 24, padding: 32, textAlign: 'center',
        marginBottom: 28, position: 'relative', overflow: 'hidden'
      }}>
        <div className="qdq-grain" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: '#F5B841', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            Code à partager
          </div>
          <div className="qdq-display" style={{ fontSize: 56, fontWeight: 800, color: '#faf7f2', letterSpacing: '0.15em', marginBottom: 16 }}>
            {room.code}
          </div>
          <button onClick={copyCode} className="qdq-btn" style={{
            background: copied ? '#4CB944' : '#F5B841', color: '#1a1a1a', border: 'none',
            padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            {copied ? <><Check size={14}/> Copié !</> : <><Copy size={14}/> Copier le code</>}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          color: '#1a1a1a', fontSize: 13, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
          <Users size={14} /> Joueurs ({room.players.length}/12)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {room.players.map((p, i) => (
            <div key={p.id} className="qdq-fadeup" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12,
              background: '#faf7f2', borderRadius: 14, border: '1.5px solid #e5e0d8',
              animationDelay: `${i * 0.05}s`
            }}>
              <Avatar name={p.name} color={p.color} size={36} />
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>
                {p.name}
                {p.id === playerId && <span style={{ color: '#6b655c', fontWeight: 400 }}> (toi)</span>}
              </div>
              {p.id === room.hostId && <Crown size={16} color="#F5B841" fill="#F5B841" />}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div className="qdq-fadeup">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Pose ta question
          </div>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Si tu pouvais dire un secret anonyme, ce serait quoi ?"
            maxLength={200} rows={3}
            style={{ width: '100%', padding: '14px 16px', fontSize: 15,
              border: '1.5px solid #e5e0d8', borderRadius: 14, background: '#faf7f2',
              resize: 'none', marginBottom: 10 }}/>
          <button onClick={pickRandom} className="qdq-btn" style={{
            background: 'transparent', border: 'none', color: '#E94F37',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
            marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            <Sparkles size={14}/> Suggérer une question
          </button>
          <Button variant="accent" onClick={() => onStart(question.trim())}
            disabled={room.players.length < 2 || !question.trim()}>
            Lancer la partie <ArrowRight size={18} />
          </Button>
          {room.players.length < 2 && (
            <p style={{ textAlign: 'center', color: '#6b655c', fontSize: 13, marginTop: 12 }}>
              Il faut au moins 2 joueurs
            </p>
          )}
        </div>
      ) : (
        <div className="qdq-fadeup" style={{
          padding: 20, background: '#faf7f2', borderRadius: 14,
          textAlign: 'center', border: '1.5px dashed #d4cec3'
        }}>
          <div className="qdq-pulse" style={{ fontSize: 15, color: '#6b655c' }}>
            En attente de <strong style={{ color: '#1a1a1a' }}>{room.players.find(p => p.id === room.hostId)?.name}</strong> pour lancer...
          </div>
        </div>
      )}
    </div>
  );
};

const AnswerScreen = ({ room, playerId, onSubmit }) => {
  const [answer, setAnswer] = useState('');
  const me = room.players.find(p => p.id === playerId);
  const myAnswer = room.answers?.[playerId];
  const answeredIds = Object.keys(room.answers || {});
  const totalPlayers = room.players.length;

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmit(answer.trim());
  };

  if (myAnswer) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div className="qdq-pop" style={{
            width: 80, height: 80, borderRadius: '50%', background: '#4CB944', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 40
          }}>✓</div>
          <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Réponse envoyée
          </h2>
          <p style={{ color: '#6b655c', marginTop: 12, marginBottom: 32, fontSize: 15 }}>
            En attente des autres joueurs...
          </p>
          <div style={{ padding: 20, background: '#1a1a1a', borderRadius: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#F5B841', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Progression
            </div>
            <div className="qdq-display" style={{ fontSize: 48, fontWeight: 800, color: '#faf7f2', lineHeight: 1 }}>
              {answeredIds.length}<span style={{ color: '#6b655c' }}>/{totalPlayers}</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {room.players.map(p => (
                <div key={p.id} style={{ opacity: answeredIds.includes(p.id) ? 1 : 0.3 }}>
                  <Avatar name={p.name} color={p.color} size={32} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={me.name} color={me.color} size={32} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{me.name}</span>
        </div>
        <div style={{ fontSize: 13, color: '#6b655c', fontWeight: 600 }}>
          {answeredIds.length}/{totalPlayers} ont répondu
        </div>
      </div>

      <div className="qdq-pop" style={{
        background: '#F5B841', borderRadius: 24, padding: 32,
        marginBottom: 24, position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: 16, left: 20, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', opacity: 0.5
        }}>
          ✦ La question
        </div>
        <p className="qdq-display" style={{
          fontSize: 28, fontWeight: 700, color: '#1a1a1a',
          lineHeight: 1.15, marginTop: 24, marginBottom: 0
        }}>
          {room.question}
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Ta réponse (secrète)
      </div>
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Écris ta réponse ici..." maxLength={300} rows={4} autoFocus
        style={{ width: '100%', padding: '16px 18px', fontSize: 16,
          border: '1.5px solid #e5e0d8', borderRadius: 14, background: '#faf7f2',
          resize: 'none', marginBottom: 8 }}/>
      <div style={{ fontSize: 12, color: '#a8a299', textAlign: 'right', marginBottom: 20 }}>
        {answer.length}/300
      </div>

      <Button variant="primary" onClick={handleSubmit} disabled={!answer.trim()}>
        <Send size={16}/> Envoyer en secret
      </Button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#a8a299', marginTop: 16, lineHeight: 1.5 }}>
        🔒 Personne ne verra ta réponse avant que tout le monde ait répondu.
      </p>
    </div>
  );
};

const GuessScreen = ({ room, playerId, onSubmitGuesses }) => {
  const [guesses, setGuesses] = useState({});
  const [currentAnswerIdx, setCurrentAnswerIdx] = useState(0);
  const myGuesses = room.guesses?.[playerId];
  const hasGuessed = !!myGuesses;

  const shuffledAnswers = React.useMemo(() => {
    const entries = Object.entries(room.answers).map(([pid, text]) => ({ answerId: pid, text }));
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

  const usedPlayerIds = Object.values(guesses);
  const currentAnswer = shuffledAnswers[currentAnswerIdx];
  const allAssigned = shuffledAnswers.every(a => guesses[a.answerId]);

  const handleAssign = (targetPlayerId) => {
    const newGuesses = { ...guesses };
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
    const guessedCount = Object.keys(room.guesses || {}).length;
    const totalPlayers = room.players.length;
    return (
      <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div className="qdq-pop" style={{
          width: 80, height: 80, borderRadius: '50%', background: '#9B5DE5', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '60px auto 24px', fontSize: 36
        }}>🔮</div>
        <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          Devinettes envoyées
        </h2>
        <p style={{ color: '#6b655c', marginTop: 12, fontSize: 15 }}>En attente des autres...</p>
        <div style={{ marginTop: 32, padding: 20, background: '#1a1a1a', borderRadius: 16 }}>
          <div className="qdq-display" style={{ fontSize: 48, fontWeight: 800, color: '#faf7f2', lineHeight: 1 }}>
            {guessedCount}<span style={{ color: '#6b655c' }}>/{totalPlayers}</span>
          </div>
          <div style={{ fontSize: 12, color: '#a8a299', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
            joueurs ont deviné
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#9B5DE5', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          ✦ À toi de deviner
        </div>
        <h2 className="qdq-display" style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.15 }}>
          Qui a dit quoi ?
        </h2>
        <p style={{ color: '#6b655c', fontSize: 13, marginTop: 6 }}>Associe chaque réponse à un joueur</p>
      </div>

      <div className="qdq-scrollbar" style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {shuffledAnswers.map((a, i) => (
          <button key={a.answerId} onClick={() => setCurrentAnswerIdx(i)} className="qdq-btn" style={{
            minWidth: 36, height: 36, borderRadius: 10,
            border: i === currentAnswerIdx ? '2px solid #1a1a1a' : '1.5px solid #e5e0d8',
            background: guesses[a.answerId] ? '#1a1a1a' : '#faf7f2',
            color: guesses[a.answerId] ? '#F5B841' : '#1a1a1a',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Fraunces, serif'
          }}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="qdq-pop" key={currentAnswerIdx} style={{
        background: '#faf7f2', border: '2px solid #1a1a1a', borderRadius: 20,
        padding: 24, marginBottom: 20, minHeight: 120,
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 11, color: '#6b655c', fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
          Réponse #{currentAnswerIdx + 1}
        </div>
        <p className="qdq-italic" style={{
          fontSize: 22, color: '#1a1a1a', margin: 0, lineHeight: 1.4
        }}>
          « {currentAnswer.text} »
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        C'est qui selon toi ?
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 8, marginBottom: 24
      }}>
        {room.players.map(p => {
          const isAssignedHere = guesses[currentAnswer.answerId] === p.id;
          const isAssignedElsewhere = usedPlayerIds.includes(p.id) && !isAssignedHere;
          return (
            <button key={p.id} onClick={() => handleAssign(p.id)} className="qdq-btn" style={{
              padding: '12px 6px',
              background: isAssignedHere ? p.color : '#faf7f2',
              border: isAssignedHere ? `2px solid ${p.color}` : '1.5px solid #e5e0d8',
              borderRadius: 14, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              opacity: isAssignedElsewhere ? 0.4 : 1
            }}>
              <Avatar name={p.name} color={p.color} size={32} />
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: isAssignedHere ? 'white' : '#1a1a1a',
                textAlign: 'center', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
              }}>
                {p.name}
              </div>
            </button>
          );
        })}
      </div>

      <Button variant="accent" onClick={() => onSubmitGuesses(guesses)} disabled={!allAssigned}>
        {allAssigned ? <>Valider mes devinettes <Check size={18}/></> : `Encore ${shuffledAnswers.length - Object.keys(guesses).length} à deviner`}
      </Button>
    </div>
  );
};

const ResultsScreen = ({ room, playerId, onNext, onLeave }) => {
  const [revealIdx, setRevealIdx] = useState(-1);
  const isHost = room.hostId === playerId;

  const shuffledAnswers = React.useMemo(() => {
    const entries = Object.entries(room.answers).map(([pid, text]) => ({ answerId: pid, text }));
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

  useEffect(() => {
    if (revealIdx < shuffledAnswers.length - 1) {
      const t = setTimeout(() => setRevealIdx(i => i + 1), revealIdx === -1 ? 500 : 1200);
      return () => clearTimeout(t);
    }
  }, [revealIdx, shuffledAnswers.length]);

  const roundScores = React.useMemo(() => {
    const scores = {};
    room.players.forEach(p => scores[p.id] = 0);
    Object.entries(room.guesses || {}).forEach(([guesserId, guessMap]) => {
      Object.entries(guessMap).forEach(([answerId, guessedPlayerId]) => {
        if (answerId === guessedPlayerId) {
          scores[guesserId] = (scores[guesserId] || 0) + 1;
        }
      });
    });
    return scores;
  }, [room.guesses, room.players]);

  const totalScores = React.useMemo(() => {
    const totals = { ...(room.totalScores || {}) };
    room.players.forEach(p => {
      totals[p.id] = (totals[p.id] || 0) + (roundScores[p.id] || 0);
    });
    return totals;
  }, [room.totalScores, roundScores, room.players]);

  const sortedPlayers = [...room.players].sort((a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0));
  const allRevealed = revealIdx >= shuffledAnswers.length - 1;

  return (
    <div style={{ padding: '32px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: '#E94F37', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          ✦ Révélations
        </div>
        <h2 className="qdq-display" style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          Et la vérité...
        </h2>
      </div>

      <div style={{ background: '#F5B841', borderRadius: 16, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', opacity: 0.6, marginBottom: 4 }}>
          La question
        </div>
        <p className="qdq-display" style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>
          {room.question}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {shuffledAnswers.map((ans, i) => {
          const revealed = i <= revealIdx;
          const author = room.players.find(p => p.id === ans.answerId);
          const correctGuessers = Object.entries(room.guesses || {})
            .filter(([_, g]) => g[ans.answerId] === ans.answerId)
            .map(([gid]) => gid);

          return (
            <div key={ans.answerId} style={{
              background: revealed ? '#faf7f2' : '#1a1a1a',
              border: revealed ? `2px solid ${author?.color || '#1a1a1a'}` : '2px solid #1a1a1a',
              borderRadius: 18, padding: 18, transition: 'all 0.5s ease',
              ...(revealed && i === revealIdx ? { animation: 'qdq-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' } : {})
            }}>
              <p className="qdq-italic" style={{
                fontSize: 18, color: revealed ? '#1a1a1a' : '#faf7f2',
                margin: '0 0 14px 0', lineHeight: 1.4
              }}>
                « {ans.text} »
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 12, borderTop: `1px solid ${revealed ? '#e5e0d8' : '#333'}`
              }}>
                {revealed && author ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={author.name} color={author.color} size={32} />
                      <div>
                        <div style={{ fontSize: 11, color: '#6b655c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          C'était
                        </div>
                        <div className="qdq-display" style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
                          {author.name}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#6b655c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Trouvé par
                      </div>
                      <div className="qdq-display" style={{ fontSize: 18, fontWeight: 700, color: correctGuessers.length > 0 ? '#4CB944' : '#E94F37' }}>
                        {correctGuessers.length}/{room.players.length - 1}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="qdq-pulse" style={{ color: '#F5B841', fontSize: 13, fontWeight: 600, textAlign: 'center', width: '100%' }}>
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
          <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Trophy size={18} color="#F5B841" />
              <div style={{ fontSize: 12, color: '#F5B841', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Classement
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedPlayers.map((p, i) => (
                <div key={p.id} className="qdq-fadeup" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: i === 0 ? 'rgba(245, 184, 65, 0.15)' : 'rgba(255,255,255,0.05)',
                  borderRadius: 12, animationDelay: `${i * 0.1}s`
                }}>
                  <div className="qdq-display" style={{
                    width: 26, textAlign: 'center', fontSize: 20, fontWeight: 800,
                    color: i === 0 ? '#F5B841' : '#a8a299'
                  }}>
                    {i + 1}
                  </div>
                  <Avatar name={p.name} color={p.color} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#faf7f2' }}>
                      {p.name}
                      {p.id === playerId && <span style={{ color: '#a8a299', fontWeight: 400 }}> (toi)</span>}
                    </div>
                    {roundScores[p.id] > 0 && (
                      <div style={{ fontSize: 11, color: '#4CB944', fontWeight: 600 }}>
                        +{roundScores[p.id]} cette manche
                      </div>
                    )}
                  </div>
                  <div className="qdq-display" style={{ fontSize: 24, fontWeight: 800, color: '#F5B841' }}>
                    {totalScores[p.id] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <Button variant="accent" onClick={() => onNext(totalScores)}>
              <RotateCcw size={18}/> Nouvelle question
            </Button>
          ) : (
            <div style={{
              padding: 20, background: '#faf7f2', borderRadius: 14,
              textAlign: 'center', border: '1.5px dashed #d4cec3'
            }}>
              <div className="qdq-pulse" style={{ fontSize: 14, color: '#6b655c' }}>
                En attente de <strong style={{ color: '#1a1a1a' }}>{room.players.find(p => p.id === room.hostId)?.name}</strong>...
              </div>
            </div>
          )}

          <button onClick={onLeave} className="qdq-btn" style={{
            background: 'transparent', border: 'none', color: '#6b655c',
            fontSize: 13, cursor: 'pointer', padding: 12, width: '100%', marginTop: 8
          }}>
            Quitter le salon
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [playerId] = useState(() => generatePlayerId());
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!roomCode) return;
    unsubRef.current = storage.subscribeRoom(roomCode, (r) => {
      if (r) setRoom(r);
    });
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [roomCode]);

  const updateRoom = async (updater) => {
    const current = await storage.getRoom(roomCode);
    if (!current) return;
    const updated = typeof updater === 'function' ? updater(current) : updater;
    await storage.setRoom(roomCode, updated);
  };

  const handleCreate = async (name) => {
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
      players: [{ id: playerId, name, color }],
      question: null, answers: {}, guesses: {}, totalScores: {},
      createdAt: Date.now()
    };
    await storage.setRoom(code, newRoom);
    setRoomCode(code);
    setRoom(newRoom);
  };

  const handleJoin = async (name, code) => {
    const existing = await storage.getRoom(code);
    if (!existing) return false;
    if (existing.phase !== 'lobby') return false;
    if (existing.players.length >= 12) return false;
    if (existing.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      name = `${name}_${Math.floor(Math.random() * 99)}`;
    }
    const color = AVATAR_COLORS[existing.players.length % AVATAR_COLORS.length];
    existing.players.push({ id: playerId, name, color });
    await storage.setRoom(code, existing);
    setRoomCode(code);
    setRoom(existing);
    return true;
  };

  const handleStart = async (question) => {
    await updateRoom(r => ({ ...r, phase: 'answering', question, answers: {}, guesses: {} }));
  };

  const handleSubmitAnswer = async (answer) => {
    const latest = await storage.getRoom(roomCode);
    if (!latest) return;
    latest.answers = { ...(latest.answers || {}), [playerId]: answer };
    if (Object.keys(latest.answers).length === latest.players.length) {
      latest.phase = 'guessing';
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

  const handleNextRound = async (newTotalScores) => {
    await updateRoom(r => ({
      ...r, phase: 'lobby', question: null,
      answers: {}, guesses: {}, totalScores: newTotalScores
    }));
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
    setRoomCode(null);
    setRoom(null);
  };

  useEffect(() => {
    if (!room || !roomCode) return;
    if (room.phase === 'answering' &&
        Object.keys(room.answers || {}).length === room.players.length &&
        room.players.length > 0) {
      updateRoom(r => ({ ...r, phase: 'guessing' }));
    }
    if (room.phase === 'guessing' &&
        Object.keys(room.guesses || {}).length === room.players.length &&
        room.players.length > 0) {
      updateRoom(r => ({ ...r, phase: 'results' }));
    }
  }, [room?.phase, room?.answers, room?.guesses, room?.players?.length]);

  return (
    <div className="qdq-root" style={{
      minHeight: '100vh', background: '#faf7f2', color: '#1a1a1a',
      position: 'relative', overflow: 'hidden'
    }}>
      <GlobalStyles />
      <div className="qdq-grain" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {!roomCode || !room ? (
          <HomeScreen onCreate={handleCreate} onJoin={handleJoin} />
        ) : room.phase === 'lobby' ? (
          <LobbyScreen room={room} playerId={playerId} onStart={handleStart} onLeave={handleLeave} />
        ) : room.phase === 'answering' ? (
          <AnswerScreen room={room} playerId={playerId} onSubmit={handleSubmitAnswer} />
        ) : room.phase === 'guessing' ? (
          <GuessScreen room={room} playerId={playerId} onSubmitGuesses={handleSubmitGuesses} />
        ) : room.phase === 'results' ? (
          <ResultsScreen room={room} playerId={playerId} onNext={handleNextRound} onLeave={handleLeave} />
        ) : null}
      </div>
    </div>
  );
}
