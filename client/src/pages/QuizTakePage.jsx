import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import api from '../api/client'
import useSpeechRecognition from '../hooks/useSpeechRecognition'

function OptionButton({ option, selected, onSelect }) {
  return (
    <button
      className={[
        'group flex items-center rounded-xl border-2 p-5 text-left transition-all',
        selected
          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100'
          : 'border-slate-200 bg-white hover:border-indigo-600 hover:bg-indigo-50/60',
      ].join(' ')}
      onClick={onSelect}
      type="button"
    >
      <span
        className={[
          'mr-4 flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold',
          selected
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : 'border-slate-200 bg-slate-50 text-slate-600 group-hover:border-indigo-600 group-hover:text-indigo-600',
        ].join(' ')}
      >
        {option.key}
      </span>
      <span className="text-base text-slate-700">{option.text}</span>
    </button>
  )
}

export default function QuizTakePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const [session, setSession] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answersByQuestionId, setAnswersByQuestionId] = useState({})
  const [draftByQuestionId, setDraftByQuestionId] = useState({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const attemptIdFromQuery = searchParams.get('attempt')

  const appendTranscript = useCallback(
    (transcript) => {
      const question = session?.questions?.[currentIndex]
      if (!question || question.type !== 'open') {
        return
      }
      setDraftByQuestionId((previous) => ({
        ...previous,
        [question.id]: `${previous[question.id] || ''} ${transcript}`.trim(),
      }))
    },
    [session, currentIndex],
  )

  const speech = useSpeechRecognition({ onTranscript: appendTranscript })

  const questions = session?.questions || []
  const currentQuestion = questions[currentIndex]
  const progressPercent = useMemo(() => {
    if (!questions.length) {
      return 0
    }
    return Math.round(((currentIndex + 1) / questions.length) * 100)
  }, [currentIndex, questions.length])

  const currentAnswer = currentQuestion ? answersByQuestionId[currentQuestion.id]?.user_answer || '' : ''
  const openDraft =
    currentQuestion?.type === 'open'
      ? draftByQuestionId[currentQuestion.id] ?? answersByQuestionId[currentQuestion.id]?.user_answer ?? ''
      : ''

  useEffect(() => {
    async function loadSession() {
      setLoading(true)
      setError('')

      try {
        let response
        if (attemptIdFromQuery) {
          response = await api.get(`/api/attempts/${attemptIdFromQuery}`)
        } else {
          response = await api.post(`/api/quizzes/${id}/attempts`, {
            resume_if_exists: true,
          })
        }

        setSession(response.data)
        setCurrentIndex(response.data.current_question_index || 0)

        const answerMap = {}
        const draftMap = {}
        for (const answer of response.data.answers || []) {
          answerMap[answer.question_id] = answer
          draftMap[answer.question_id] = answer.user_answer
        }

        setAnswersByQuestionId(answerMap)
        setDraftByQuestionId(draftMap)
      } catch (requestError) {
        setError(requestError.response?.data?.detail || 'Failed to load quiz session')
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [id, attemptIdFromQuery])

  async function saveAnswer(questionId, userAnswer) {
    if (!session) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await api.put(`/api/attempts/${session.id}/answers/${questionId}`, {
        user_answer: userAnswer,
      })

      setAnswersByQuestionId((previous) => ({
        ...previous,
        [questionId]: {
          question_id: questionId,
          user_answer: userAnswer,
          score: response.data.score,
          ai_feedback: response.data.ai_feedback,
          updated_at: new Date().toISOString(),
        },
      }))

      return response.data
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to save answer')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function submitQuiz() {
    if (!session) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await api.post(`/api/attempts/${session.id}/complete`)
      navigate(`/quizzes/${id}/results?attempt=${session.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to submit quiz')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-slate-500">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8">Loading quiz session...</div>
      </div>
    )
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-slate-500">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">Quiz session unavailable.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between gap-8 px-6">
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-sm font-semibold uppercase tracking-wider text-slate-600">{session.quiz_title || 'Quiz Session'}</h1>
              <span className="text-sm font-bold text-indigo-600">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50" to={`/quizzes/${id}/edit`}>
              <span className="material-symbols-outlined text-lg">close</span>
              Exit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
            {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Open-Ended / Viva'}
          </div>
          <h2 className="text-2xl font-semibold leading-relaxed text-slate-900">{currentQuestion.question_text}</h2>
        </div>

        {currentQuestion.type === 'mcq' ? (
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options?.map((option) => (
              <OptionButton
                key={option.key}
                onSelect={() => saveAnswer(currentQuestion.id, option.key)}
                option={option}
                selected={currentAnswer === option.key}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              className="w-full resize-none rounded-2xl border-2 border-slate-200 p-6 text-lg text-slate-700 transition-all focus:border-indigo-600 focus:ring-0"
              onChange={(event) =>
                setDraftByQuestionId((previous) => ({
                  ...previous,
                  [currentQuestion.id]: event.target.value,
                }))
              }
              placeholder="Type your answer here..."
              rows={6}
              value={openDraft}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {speech.supported ? (
                <button
                  className={[
                    'flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-colors',
                    speech.isListening ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-600 hover:bg-indigo-500',
                  ].join(' ')}
                  onClick={speech.isListening ? speech.stop : speech.start}
                  type="button"
                >
                  <span className="material-symbols-outlined">mic</span>
                  {speech.isListening ? 'Stop Dictation' : 'Dictate Answer'}
                </button>
              ) : (
                <span className="text-sm text-slate-500">Dictation unavailable in this browser.</span>
              )}

              <button
                className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={saving}
                onClick={() => saveAnswer(currentQuestion.id, openDraft)}
                type="button"
              >
                {saving ? 'Saving...' : 'Save Answer'}
              </button>
            </div>
            {speech.error ? <p className="text-sm text-red-600">Speech error: {speech.error}</p> : null}
          </div>
        )}

        {answersByQuestionId[currentQuestion.id]?.ai_feedback ? (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Latest Feedback</p>
            <p className="mt-2 text-sm text-slate-700">{answersByQuestionId[currentQuestion.id].ai_feedback}</p>
          </div>
        ) : null}
      </main>

      <footer className="sticky bottom-0 border-t border-slate-200 bg-white py-6 px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <button
            className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            disabled={currentIndex <= 0}
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            type="button"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Previous
          </button>

          <div className="flex items-center gap-4">
            <button
              className="rounded-xl border border-slate-200 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              type="button"
            >
              Skip Question
            </button>
            <button
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-10 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-500 disabled:opacity-60"
              disabled={currentIndex >= questions.length - 1}
              onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              type="button"
            >
              Next Question
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          <button
            className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            disabled={saving}
            onClick={submitQuiz}
            type="button"
          >
            Submit Quiz
          </button>
        </div>
      </footer>
    </div>
  )
}
