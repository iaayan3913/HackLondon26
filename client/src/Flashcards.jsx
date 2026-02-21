import { useState, useEffect } from 'react'
import axios from 'axios'

// Inject CSS keyframes once
const styleTag = document.createElement('style')
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
`
if (!document.head.querySelector('[data-fc-styles]')) {
  styleTag.setAttribute('data-fc-styles', '')
  document.head.appendChild(styleTag)
}

// ─── Colour tokens matched to StudyPro design ───────────────────────────────
const C = {
  primary:    '#4F46E5',
  primaryHov: '#4338CA',
  primaryBg:  '#EEF2FF',
  green:      '#22C55E',
  greenBg:    '#DCFCE7',
  red:        '#EF4444',
  redBg:      '#FEE2E2',
  amber:      '#F59E0B',
  amberBg:    '#FEF3C7',
  blue:       '#3B82F6',
  blueBg:     '#DBEAFE',
  text:       '#111827',
  muted:      '#6B7280',
  border:     '#E5E7EB',
  bg:         '#F9FAFB',
  white:      '#FFFFFF',
}

// ─── Sample decks (replace with API call in production) ─────────────────────
const SAMPLE_DECKS = [
  { id: 1, title: 'Human Anatomy II',   subject: 'MEDICINE',   cards: 128, progress: 65, lastPracticed: '2h ago',  colour: C.primary,  colourBg: C.primaryBg },
  { id: 2, title: 'Microbiology Basic', subject: 'BIOLOGY',    cards: 54,  progress: 30, lastPracticed: '5h ago',  colour: C.blue,     colourBg: C.blueBg    },
  { id: 3, title: 'Organic Compounds',  subject: 'CHEMISTRY',  cards: 89,  progress: 88, lastPracticed: '1d ago',  colour: C.green,    colourBg: C.greenBg   },
  { id: 4, title: 'Calculus I',         subject: 'MATHS',      cards: 40,  progress: 52, lastPracticed: '3d ago',  colour: C.amber,    colourBg: C.amberBg   },
]

// ─── View states ─────────────────────────────────────────────────────────────
// 'decks'     → deck overview
// 'generate'  → paste notes + generate
// 'study'     → flip card session
// 'complete'  → session done

export default function Flashcards() {
  const [view, setView]           = useState('decks')
  const [decks, setDecks]         = useState(SAMPLE_DECKS)
  const [activeDeck, setActiveDeck] = useState(null)

  // generate state
  const [noteText, setNoteText]   = useState('')
  const [maxCards, setMaxCards]   = useState(12)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // study session state
  const [deck, setDeck]           = useState([])      // current card queue
  const [totalCards, setTotalCards] = useState(0)
  const [cardIdx, setCardIdx]     = useState(0)
  const [flipped, setFlipped]     = useState(false)
  const [stats, setStats]         = useState({ easy: 0, hard: 0, missed: 0 })

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!noteText.trim()) { setError('Please paste some notes first.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:8000/flashcards/generate', {
        note_text: noteText,
        max_cards: maxCards,
      })
      const cards = res.data.flashcards
      setDeck(cards)
      setTotalCards(cards.length)
      setCardIdx(0)
      setFlipped(false)
      setStats({ easy: 0, hard: 0, missed: 0 })
      setView('study')
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRate(rating) {
    if (!flipped) { setError('Flip the card first!'); return }
    setError('')

    const newStats = { ...stats, [rating]: stats[rating] + 1 }
    setStats(newStats)

    try {
      const res = await axios.post('http://localhost:8000/flashcards/rate', {
        cards: deck,
        card_id: deck[cardIdx % deck.length].id,
        rating,
      })
      const updated = res.data.cards
      setDeck(updated)

      if (res.data.session_complete || updated.length === 0) {
        setView('complete')
        return
      }
      setCardIdx(cardIdx % updated.length)
      setFlipped(false)
    } catch {
      setError('Rating failed — check backend.')
    }
  }

  function startStudy(deckData) {
    setActiveDeck(deckData)
    setView('generate')
  }

  function resetToDecks() {
    setView('decks')
    setNoteText('')
    setError('')
  }

  // Keyboard shortcuts during study
  useEffect(() => {
    if (view !== 'study') return
    function onKey(e) {
      if (e.code === 'Space')                           { e.preventDefault(); setFlipped(f => !f) }
      if (e.code === 'Digit1' || e.code === 'Numpad1') handleRate('missed')
      if (e.code === 'Digit2' || e.code === 'Numpad2') handleRate('hard')
      if (e.code === 'Digit3' || e.code === 'Numpad3') handleRate('easy')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, flipped, deck, cardIdx])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* ── View: DECKS ────────────────────────────────────────────────────── */}
      {view === 'decks' && (
        <div style={s.fadeIn}>
          {/* Header */}
          <div style={s.pageHeader}>
            <div>
              <h1 style={s.pageTitle}>Flashcard Decks</h1>
              <p style={s.pageSubtitle}>Review your saved decks or generate new cards from your notes.</p>
            </div>
            <button style={s.btnPrimary} onClick={() => setView('generate')}>
              + Generate New Deck
            </button>
          </div>

          {/* Stats strip */}
          <div style={s.statsRow}>
            <StatChip icon="📚" label="Total Decks"    value={decks.length}                           colour={C.primary} colourBg={C.primaryBg} />
            <StatChip icon="🃏" label="Total Cards"    value={decks.reduce((a,d)=>a+d.cards,0)}       colour={C.blue}    colourBg={C.blueBg}    />
            <StatChip icon="✅" label="Avg. Mastery"   value={Math.round(decks.reduce((a,d)=>a+d.progress,0)/decks.length)+'%'} colour={C.green} colourBg={C.greenBg} />
          </div>

          {/* Deck grid */}
          <div style={s.deckGrid}>
            {/* Create new */}
            <button style={s.createCard} onClick={() => setView('generate')}>
              <span style={s.createPlus}>+</span>
              <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Create New Deck</span>
            </button>

            {decks.map(d => (
              <DeckCard key={d.id} deck={d} onStudy={() => startStudy(d)} />
            ))}
          </div>
        </div>
      )}

      {/* ── View: GENERATE ─────────────────────────────────────────────────── */}
      {view === 'generate' && (
        <div style={s.fadeIn}>
          <div style={s.pageHeader}>
            <div>
              <button style={s.backBtn} onClick={resetToDecks}>← Back to Decks</button>
              <h1 style={{ ...s.pageTitle, marginTop: 8 }}>Generate Flashcards</h1>
              <p style={s.pageSubtitle}>Paste your notes or transcript — AI extracts key term/definition pairs.</p>
            </div>
          </div>

          <div style={s.generateWrap}>
            {/* Left: input */}
            <div style={s.card}>
              <label style={s.label}>Your Notes / Transcript</label>
              <textarea
                style={s.textarea}
                placeholder="Paste your lecture notes, transcript, or study material here…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <div style={s.generateFooter}>
                <div style={s.maxCardsRow}>
                  <label style={s.label}>Max cards:</label>
                  <input
                    type="number"
                    min={3} max={30}
                    value={maxCards}
                    onChange={e => setMaxCards(+e.target.value)}
                    style={s.numInput}
                  />
                </div>
                <button
                  style={loading ? s.btnDisabled : s.btnPrimary}
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display:'flex', alignItems:'center', gap: 8 }}>
                      <Spinner /> Extracting with AI…
                    </span>
                  ) : '✨ Generate Flashcards'}
                </button>
              </div>
              {error && <p style={s.errorText}>{error}</p>}
            </div>

            {/* Right: tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={s.card}>
                <p style={{ ...s.label, marginBottom: 12 }}>💡 Tips for best results</p>
                {[
                  'Paste at least a few paragraphs for richer cards.',
                  'Lecture transcripts and structured notes work best.',
                  'More specific content = more precise definitions.',
                  'You can generate multiple decks from the same notes.',
                ].map((tip, i) => (
                  <div key={i} style={s.tipRow}>
                    <span style={s.tipDot} />
                    <span style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...s.card, background: C.primaryBg, border: `1px solid #C7D2FE` }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 6 }}>📌 How it works</p>
                <p style={{ fontSize: 13, color: '#4338CA', lineHeight: 1.6 }}>
                  Your notes are sent to an AI model which identifies the most testable concepts and pairs each term with a clear, student-friendly definition.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View: STUDY ────────────────────────────────────────────────────── */}
      {view === 'study' && deck.length > 0 && (
        <div style={s.fadeIn}>
          <div style={s.pageHeader}>
            <div>
              <button style={s.backBtn} onClick={() => setView('generate')}>← Back</button>
              <h1 style={{ ...s.pageTitle, marginTop: 8 }}>Study Session</h1>
            </div>
            <div style={s.sessionMeta}>
              <StatChip icon="✅" label="Easy"   value={stats.easy}   colour={C.green} colourBg={C.greenBg} small />
              <StatChip icon="〜" label="Hard"   value={stats.hard}   colour={C.blue}  colourBg={C.blueBg}  small />
              <StatChip icon="✗"  label="Missed" value={stats.missed} colour={C.red}   colourBg={C.redBg}   small />
            </div>
          </div>

          {/* Progress bar */}
          <div style={s.progressWrap}>
            <div style={s.progressMeta}>
              <span style={{ fontSize: 13, color: C.muted }}>
                Card {(cardIdx % deck.length) + 1} of {deck.length} remaining
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>
                {Math.round(((totalCards - deck.length) / totalCards) * 100)}% mastered
              </span>
            </div>
            <div style={s.progressTrack}>
              <div
                style={{
                  ...s.progressFill,
                  width: `${((totalCards - deck.length) / totalCards) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Flashcard */}
          <div style={s.cardScene} onClick={() => setFlipped(f => !f)}>
            <div style={{ ...s.cardInner, transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

              {/* Front */}
              <div style={s.cardFront}>
                <span style={s.cardFaceLabel}>TERM</span>
                <p style={s.cardTerm}>{deck[cardIdx % deck.length]?.term}</p>
                <div style={s.cardCounter}>
                  {(cardIdx % deck.length) + 1} / {deck.length}
                </div>
                <span style={s.cardHint}>Click to reveal definition</span>
              </div>

              {/* Back */}
              <div style={s.cardBack}>
                <span style={s.cardFaceLabel}>DEFINITION</span>
                <p style={s.cardDefinition}>{deck[cardIdx % deck.length]?.definition}</p>
                <div style={s.cardCounter}>
                  {(cardIdx % deck.length) + 1} / {deck.length}
                </div>
                <span style={s.cardHint}>Rate yourself below</span>
              </div>

            </div>
          </div>

          {/* Rating buttons */}
          <div style={s.ratingRow}>
            <button style={s.btnMissed} onClick={() => handleRate('missed')}>✗ Missed</button>
            <button style={s.btnHard}   onClick={() => handleRate('hard')}>〜 Hard</button>
            <button style={s.btnEasy}   onClick={() => handleRate('easy')}>✓ Easy</button>
          </div>

          {error && <p style={{ ...s.errorText, textAlign: 'center', marginTop: 8 }}>{error}</p>}

          <p style={{ textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 8 }}>
            Keyboard shortcuts: <kbd style={s.kbd}>Space</kbd> flip &nbsp;
            <kbd style={s.kbd}>1</kbd> missed &nbsp;
            <kbd style={s.kbd}>2</kbd> hard &nbsp;
            <kbd style={s.kbd}>3</kbd> easy
          </p>
        </div>
      )}

      {/* ── View: COMPLETE ─────────────────────────────────────────────────── */}
      {view === 'complete' && (
        <div style={{ ...s.fadeIn, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
          <div style={{ ...s.card, maxWidth: 480, textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ ...s.pageTitle, marginBottom: 8 }}>Session Complete!</h2>
            <p style={{ color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
              You reviewed {totalCards} card{totalCards !== 1 ? 's' : ''}  —{' '}
              <strong style={{ color: C.green }}>{stats.easy} mastered</strong>,{' '}
              <strong style={{ color: C.blue }}>{stats.hard} to review</strong>,{' '}
              <strong style={{ color: C.red }}>{stats.missed} missed</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={s.btnOutline} onClick={() => setView('generate')}>Generate New Deck</button>
              <button style={s.btnPrimary} onClick={resetToDecks}>Back to Decks</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeckCard({ deck, onStudy }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...s.deckCard, boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.10)' : s.deckCard.boxShadow }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Subject tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ ...s.subjectTag, background: deck.colourBg, color: deck.colour }}>
          {deck.subject}
        </span>
        <span style={{ fontSize: 18, cursor: 'pointer', color: C.muted }}>⋯</span>
      </div>

      <p style={s.deckTitle}>{deck.title}</p>

      <div style={s.deckMeta}>
        <span>{deck.cards} cards</span>
        <span>Last practiced {deck.lastPracticed}</span>
      </div>

      {/* Progress */}
      <div style={{ marginTop: 'auto', paddingTop: 14 }}>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${deck.progress}%`, background: deck.colour }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{deck.progress}%</span>
        </div>
      </div>

      <button
        style={{ ...s.btnPrimary, marginTop: 14, width: '100%', justifyContent: 'center' }}
        onClick={onStudy}
      >
        Study Now
      </button>
    </div>
  )
}

function StatChip({ icon, label, value, colour, colourBg, small }) {
  return (
    <div style={{ ...s.statChip, padding: small ? '8px 14px' : '16px 20px' }}>
      <div style={{ ...s.statIcon, background: colourBg, color: colour, width: small ? 32 : 40, height: small ? 32 : 40, fontSize: small ? 14 : 18 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: small ? 11 : 12, color: C.muted, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: small ? 15 : 20, fontWeight: 700, color: C.text }}>{value}</p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16,
      border: '2px solid #C7D2FE',
      borderTopColor: C.white,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    padding: '20px',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    minHeight: '100%',
  },
  fadeIn: {
    animation: 'fadeUp 0.3s ease both',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 14,
    color: C.muted,
    marginTop: 4,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: C.primary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  statsRow: {
    display: 'flex',
    gap: 14,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  statChip: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: '1 1 140px',
  },
  statIcon: {
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sessionMeta: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },

  // deck grid
  deckGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 18,
  },
  createCard: {
    background: C.white,
    border: `2px dashed ${C.border}`,
    borderRadius: 14,
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    cursor: 'pointer',
    minHeight: 210,
    transition: 'border-color 0.2s',
  },
  createPlus: {
    fontSize: 28,
    color: C.muted,
    lineHeight: 1,
  },
  deckCard: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 210,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.2s',
  },
  subjectTag: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    padding: '3px 9px',
    borderRadius: 999,
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    margin: '4px 0 6px',
    lineHeight: 1.3,
  },
  deckMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: C.muted,
  },

  // progress
  progressWrap: {
    marginBottom: 24,
  },
  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    background: C.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: C.primary,
    borderRadius: 999,
    transition: 'width 0.4s ease',
  },

  // card
  card: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    display: 'block',
    marginBottom: 8,
  },
  textarea: {
    width: '100%',
    minHeight: 220,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 13,
    color: C.text,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.6,
    background: C.bg,
    boxSizing: 'border-box',
  },
  generateWrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 20,
    alignItems: 'start',
  },
  generateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  maxCardsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  numInput: {
    width: 64,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    outline: 'none',
    background: C.bg,
    color: C.text,
  },
  tipRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipDot: {
    width: 5, height: 5,
    borderRadius: '50%',
    background: C.primary,
    flexShrink: 0,
    marginTop: 7,
  },

  // flashcard 3D flip
  cardScene: {
    width: '100%',
    maxWidth: 520,
    height: 290,
    margin: '0 auto 24px',
    perspective: 1200,
    cursor: 'pointer',
  },
  cardInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardFront: {
    position: 'absolute',
    inset: 0,
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    textAlign: 'center',
    borderTop: `4px solid ${C.primary}`,
  },
  cardBack: {
    position: 'absolute',
    inset: 0,
    background: C.primaryBg,
    border: `1px solid #C7D2FE`,
    borderRadius: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: 'rotateY(180deg)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    textAlign: 'center',
    borderTop: `4px solid ${C.primary}`,
  },
  cardFaceLabel: {
    position: 'absolute',
    top: 16,
    left: 20,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: C.muted,
  },
  cardCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 11,
    color: C.muted,
    background: C.bg,
    border: `1px solid ${C.border}`,
    padding: '2px 8px',
    borderRadius: 6,
  },
  cardTerm: {
    fontSize: 'clamp(1.2rem, 3vw, 1.7rem)',
    fontWeight: 700,
    color: C.text,
    lineHeight: 1.2,
    margin: 0,
  },
  cardDefinition: {
    fontSize: 14,
    color: '#3730A3',
    lineHeight: 1.65,
    margin: 0,
  },
  cardHint: {
    position: 'absolute',
    bottom: 16,
    fontSize: 11,
    color: C.muted,
  },

  // rating
  ratingRow: {
    display: 'flex',
    gap: 12,
    maxWidth: 520,
    margin: '0 auto',
  },
  btnEasy: {
    flex: 1, padding: '11px 0',
    background: C.greenBg, color: C.green,
    border: `1.5px solid ${C.green}`,
    borderRadius: 10, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  btnHard: {
    flex: 1, padding: '11px 0',
    background: C.blueBg, color: C.blue,
    border: `1.5px solid ${C.blue}`,
    borderRadius: 10, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  btnMissed: {
    flex: 1, padding: '11px 0',
    background: C.redBg, color: C.red,
    border: `1.5px solid ${C.red}`,
    borderRadius: 10, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s',
  },

  // general buttons
  btnPrimary: {
    background: C.primary, color: C.white,
    border: 'none', borderRadius: 10,
    padding: '10px 20px', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'background 0.15s',
  },
  btnOutline: {
    background: C.white, color: C.primary,
    border: `1.5px solid ${C.primary}`,
    borderRadius: 10, padding: '10px 20px',
    fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDisabled: {
    background: '#A5B4FC', color: C.white,
    border: 'none', borderRadius: 10,
    padding: '10px 20px', fontWeight: 600, fontSize: 14,
    cursor: 'not-allowed', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 8,
  },

  // misc
  errorText: {
    color: C.red, fontSize: 13, marginTop: 10,
    background: C.redBg, padding: '8px 12px',
    borderRadius: 8,
  },
  kbd: {
    background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 4, padding: '1px 6px',
    fontSize: 11, fontFamily: 'monospace',
  },
}