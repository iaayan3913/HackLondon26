import { useState } from 'react'

const s = {
  container: { padding: 40, fontFamily: "Plus Jakarta Sans, sans-serif" },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { color: '#6B7280', marginTop: 8 },
  inputGroup: { display: 'flex', gap: 12, marginBottom: 32 },
  input: { flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #E5E7EB', outline: 'none', transition: 'border-color 0.2s' },
  button: { padding: '12px 24px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  disabledButton: { padding: '12px 24px', borderRadius: 12, border: 'none', background: '#A5B4FC', color: '#fff', fontWeight: 600, cursor: 'not-allowed' },
  error: { padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 16 },
  summaryBox: { padding: 24, background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', lineHeight: 1.6, color: '#374151' },
  pointsList: { paddingLeft: 20, color: '#374151', lineHeight: '1.8' },
  pointItem: { marginBottom: 8 },
  questionCard: { background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 16 },
  questionText: { fontWeight: 600, color: '#111827', marginBottom: 12 },
  optionsList: { display: 'grid', gap: 8 },
  optionBtn: { padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' },
  explanation: { marginTop: 12, padding: 12, background: '#EEF2FF', color: '#4338CA', borderRadius: 8, fontSize: 14 }
}

export default function Transcription() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState({})

  async function handleAnalyze() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('http://localhost:8000/transcription/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url })
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to analyze video')
      }
      const data = await response.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>Video Transcription Studio</h1>
        <p style={s.subtitle}>Generate summaries and quiz questions from any educational YouTube video.</p>
      </header>

      <div style={s.inputGroup}>
        <input 
          style={s.input} 
          placeholder="Paste YouTube URL here..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button 
          style={loading ? s.disabledButton : s.button}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Generate Notes'}
        </button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {result && (
        <div className="fade-up">
          <div style={s.section}>
            <h2 style={s.sectionTitle}>📝 Summary</h2>
            <div style={s.summaryBox}>{result.summary}</div>
          </div>

          <div style={s.section}>
            <h2 style={s.sectionTitle}>🔑 Key Points</h2>
            <ul style={s.pointsList}>
              {result.key_points.map((point, i) => (
                <li key={i} style={s.pointItem}>{point}</li>
              ))}
            </ul>
          </div>

          <div style={s.section}>
            <h2 style={s.sectionTitle}>❓ Quiz Questions</h2>
            {result.questions.map((q, i) => (
              <div key={i} style={s.questionCard}>
                <p style={s.questionText}>{i + 1}. {q.question_text}</p>
                
                {q.type === 'mcq' && (
                  <div style={s.optionsList}>
                    {q.options.map((opt, j) => {
                      const isCorrect = String.fromCharCode(65 + j) === q.correct_option
                      const isRevealed = revealed[i]
                      let bg = '#fff'
                      let border = '#E5E7EB'
                      
                      if (isRevealed) {
                        if (isCorrect) { bg = '#DCFCE7'; border = '#22C55E' }
                      }

                      return (
                        <button 
                          key={j} 
                          style={{ ...s.optionBtn, background: bg, borderColor: border }}
                          onClick={() => setRevealed(prev => ({ ...prev, [i]: true }))}
                        >
                          <span style={{ fontWeight: 600, marginRight: 8 }}>{String.fromCharCode(65 + j)}.</span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.type === 'open' && (
                   <button 
                     style={s.button}
                     onClick={() => setRevealed(prev => ({ ...prev, [i]: !prev[i] }))}
                   >
                     {revealed[i] ? 'Hide Answer' : 'Show Answer'}
                   </button>
                )}

                {revealed[i] && (
                  <div style={s.explanation}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
