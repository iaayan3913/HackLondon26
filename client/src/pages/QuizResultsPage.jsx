import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import api from '../api/client'
import StudyProLayout from '../components/quiz/StudyProLayout'

function ScoreRing({ percentage }) {
  const normalized = Math.max(0, Math.min(100, percentage))
  const circumference = 2 * Math.PI * 70
  const offset = circumference - (normalized / 100) * circumference

  return (
    <div className="relative flex-shrink-0">
      <svg className="h-40 w-40 -rotate-90">
        <circle className="text-slate-100" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="12" />
        <circle
          className="text-indigo-600"
          cx="80"
          cy="80"
          fill="transparent"
          r="70"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="12"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{normalized.toFixed(1)}%</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Score</span>
      </div>
    </div>
  )
}

function McqReview({ question }) {
  return (
    <div className="space-y-2">
      {(question.options || []).map((option) => {
        const isUserAnswer = question.user_answer === option.key
        const isCorrect = question.correct_option === option.key

        return (
          <div
            key={option.key}
            className={[
              'flex items-center gap-3 rounded-lg border p-3',
              isCorrect
                ? 'border-green-200 bg-green-50'
                : isUserAnswer
                  ? 'border-red-200 bg-red-50'
                  : 'border-slate-100 bg-slate-50',
            ].join(' ')}
          >
            <div
              className={[
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                isCorrect
                  ? 'border-green-500 bg-green-500 text-white'
                  : isUserAnswer
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-slate-300 text-slate-500',
              ].join(' ')}
            >
              {option.key}
            </div>
            <span className="text-sm">{option.text}</span>
            {isUserAnswer ? <span className="ml-auto text-[10px] font-bold uppercase text-slate-500">Your Answer</span> : null}
            {isCorrect ? <span className="ml-auto text-[10px] font-bold uppercase text-green-600">Correct</span> : null}
          </div>
        )
      })}
    </div>
  )
}

function OpenReview({ question }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Your Answer</p>
        <p className="text-sm italic text-slate-700">{question.user_answer || 'No answer provided.'}</p>
      </div>

      {question.ai_feedback ? (
        <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-green-700">
            AI Feedback & Score: {(question.score * 10).toFixed(1)}/10
          </p>
          <p className="text-sm text-slate-700">{question.ai_feedback}</p>
        </div>
      ) : null}
    </div>
  )
}

export default function QuizResultsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const attemptFromQuery = searchParams.get('attempt')

  const scoreSummary = useMemo(() => {
    if (!result) {
      return { correct: 0, total: 0 }
    }

    const mcq = result.questions.filter((question) => question.type === 'mcq')
    const correct = mcq.filter((question) => question.is_correct).length
    return { correct, total: mcq.length }
  }, [result])

  useEffect(() => {
    async function loadResults() {
      setLoading(true)
      setError('')

      try {
        let attemptId = attemptFromQuery
        if (!attemptId) {
          const attemptsResponse = await api.get(`/api/quizzes/${id}/attempts`, {
            params: { page: 1, page_size: 10 },
          })
          const completed = attemptsResponse.data.items.find((attempt) => attempt.status === 'completed')
          if (!completed) {
            throw new Error('No completed attempts found')
          }
          attemptId = completed.id
        }

        const response = await api.get(`/api/attempts/${attemptId}/results`)
        setResult(response.data)
      } catch (requestError) {
        setError(requestError.response?.data?.detail || requestError.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [id, attemptFromQuery])

  if (loading) {
    return (
      <StudyProLayout>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading results...</div>
      </StudyProLayout>
    )
  }

  if (error || !result) {
    return (
      <StudyProLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">{error || 'No results available'}</div>
      </StudyProLayout>
    )
  }

  return (
    <StudyProLayout>
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link className="flex items-center gap-1 hover:text-indigo-600" to="/quizzes">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Quizzes
        </Link>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-10 p-8 md:flex-row">
          <ScoreRing percentage={result.percentage} />
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">auto_awesome</span>
              <h2 className="text-lg font-bold text-slate-800">AI Assessment Summary</h2>
            </div>
            <p className="mb-6 leading-relaxed text-slate-600">
              You completed this attempt with a normalized score of {result.percentage.toFixed(1)}%. Review each question below to see
              explanations and AI feedback.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-500">Questions</p>
                <p className="font-bold text-slate-800">{result.questions.length}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-500">Correct (MCQ)</p>
                <p className="font-bold text-green-600">
                  {scoreSummary.correct} / {scoreSummary.total}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-500">Status</p>
                <p className="font-bold text-blue-600">{result.status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xl font-bold">Question Review</h3>
        </div>

        {result.questions.map((question, index) => (
          <div key={question.question_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{question.question_text}</p>
                  </div>
                </div>
                <span
                  className={[
                    'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase',
                    question.type === 'mcq'
                      ? question.is_correct
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-blue-700',
                  ].join(' ')}
                >
                  <span className="material-symbols-outlined text-sm">{question.type === 'mcq' ? (question.is_correct ? 'check_circle' : 'cancel') : 'auto_awesome'}</span>
                  {question.type === 'mcq' ? (question.is_correct ? 'Correct' : 'Incorrect') : 'AI Graded'}
                </span>
              </div>

              {question.type === 'mcq' ? <McqReview question={question} /> : <OpenReview question={question} />}

              {question.explanation?.text ? (
                <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Explanation
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{question.explanation.text}</p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 mb-4 flex items-center justify-between">
        <button className="rounded-xl border border-slate-200 px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100" type="button">
          Download PDF Report
        </button>
        <div className="flex gap-4">
          <button className="rounded-xl border border-indigo-600 px-6 py-2.5 font-bold text-indigo-600 hover:bg-indigo-50" onClick={() => navigate(`/quizzes/${id}/take`)} type="button">
            Retake Quiz
          </button>
          <button className="rounded-xl bg-indigo-600 px-8 py-2.5 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500" onClick={() => navigate('/quizzes')} type="button">
            Next Study Session
          </button>
        </div>
      </div>
    </StudyProLayout>
  )
}
