import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../api/client'
import AppShell from '../components/AppShell'

const PAGE_SIZE = 10

function QuizCard({ quiz, onDelete, onStart, onEdit }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
          {quiz.subject}
        </div>
        <div className="flex gap-1">
          <button className="p-1 text-slate-400 transition-colors hover:text-indigo-600" onClick={() => onEdit(quiz)} type="button">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button className="p-1 text-slate-400 transition-colors hover:text-red-500" onClick={() => onDelete(quiz)} type="button">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>

      <h3 className="mb-1 text-lg font-bold">{quiz.title}</h3>
      <p className="mb-6 text-xs text-slate-500">
        {quiz.description || `Created: ${new Date(quiz.created_at).toLocaleDateString()}`}
      </p>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-slate-400">quiz</span>
          <span className="text-xs font-medium text-slate-600">{quiz.question_count} Questions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-slate-400">history</span>
          <span className="text-xs font-medium text-slate-600">{quiz.attempt_count} Attempts</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Score</p>
          <p className="text-lg font-bold text-indigo-600">{quiz.best_score == null ? '—' : `${quiz.best_score.toFixed(1)}%`}</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
          onClick={() => onStart(quiz)}
          type="button"
        >
          Start Quiz
          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
        </button>
      </div>
    </div>
  )
}

export default function QuizListPage() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const showingStart = useMemo(() => (page - 1) * PAGE_SIZE + 1, [page])
  const showingEnd = useMemo(() => Math.min(total, page * PAGE_SIZE), [page, total])

  const loadQuizzes = useCallback(async (pageToLoad = 1) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/quizzes', {
        params: {
          page: pageToLoad,
          page_size: PAGE_SIZE,
        },
      })
      setQuizzes(response.data.items)
      setPage(response.data.page)
      setTotal(response.data.total)
      setTotalPages(response.data.total_pages)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuizzes(1)
  }, [loadQuizzes])

  async function createQuiz() {
    try {
      const response = await api.post('/api/quizzes', {
        title: 'Untitled Quiz',
        subject: 'General',
        description: '',
      })
      navigate(`/quizzes/${response.data.id}/edit`)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to create quiz')
    }
  }

  async function deleteQuiz(quiz) {
    if (!window.confirm(`Delete ${quiz.title}?`)) {
      return
    }

    try {
      await api.delete(`/api/quizzes/${quiz.id}`)
      await loadQuizzes(page)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to delete quiz')
    }
  }

  return (
    <AppShell activeNav="quizzes">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Quizzes</h2>
            <p className="mt-1 text-sm text-slate-500">Review your progress and test your knowledge.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50" type="button">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500" onClick={createQuiz} type="button">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Quiz
            </button>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading quizzes...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <button
                className="group flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                onClick={createQuiz}
                type="button"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="font-semibold text-slate-700">Create New Quiz</span>
                <span className="mt-1 text-xs text-slate-500">AI-powered or manual creation</span>
              </button>

              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onDelete={deleteQuiz}
                  onEdit={(item) => navigate(`/quizzes/${item.id}/edit`)}
                  onStart={(item) => navigate(`/quizzes/${item.id}/take`)}
                />
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-700">{total ? showingStart : 0}</span> to{' '}
                <span className="font-semibold text-slate-700">{showingEnd}</span> of{' '}
                <span className="font-semibold text-slate-700">{total}</span> quizzes
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-slate-200 p-2 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => loadQuizzes(page - 1)}
                  type="button"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">{page}</span>
                <button
                  className="rounded-lg border border-slate-200 p-2 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => loadQuizzes(page + 1)}
                  type="button"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
