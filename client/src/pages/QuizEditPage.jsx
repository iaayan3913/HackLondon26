import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import api from '../api/client'
import AttemptsTable from '../components/quiz/AttemptsTable'
import GenerationPanel from '../components/quiz/GenerationPanel'
import QuestionCard from '../components/quiz/QuestionCard'
import StudyProLayout from '../components/quiz/StudyProLayout'

const ATTEMPTS_PAGE_SIZE = 10

function NewQuestionForm({ onCreate, loading }) {
  const [type, setType] = useState('mcq')
  const [questionText, setQuestionText] = useState('')
  const [optionsText, setOptionsText] = useState('Option A\nOption B\nOption C\nOption D')
  const [correctOption, setCorrectOption] = useState('A')
  const [explanationText, setExplanationText] = useState('')

  const submit = async (event) => {
    event.preventDefault()

    const options =
      type === 'mcq'
        ? optionsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 4)
            .map((text, index) => ({ key: 'ABCD'[index], text }))
        : null

    await onCreate({
      type,
      question_text: questionText,
      options,
      correct_option: type === 'mcq' ? correctOption : null,
      explanation: explanationText ? { text: explanationText } : {},
    })

    setQuestionText('')
    setExplanationText('')
    setOptionsText('Option A\nOption B\nOption C\nOption D')
  }

  return (
    <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submit}>
      <h4 className="mb-4 text-base font-bold">Add Question</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Question Type</label>
          <select className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" onChange={(event) => setType(event.target.value)} value={type}>
            <option value="mcq">Multiple Choice</option>
            <option value="open">Open</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Correct Option</label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
            disabled={type !== 'mcq'}
            onChange={(event) => setCorrectOption(event.target.value)}
            value={correctOption}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Question</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
            onChange={(event) => setQuestionText(event.target.value)}
            required
            rows={3}
            value={questionText}
          />
        </div>

        {type === 'mcq' ? (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Options (one per line)</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
              onChange={(event) => setOptionsText(event.target.value)}
              required
              rows={4}
              value={optionsText}
            />
          </div>
        ) : null}

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Explanation / Marking Guide</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
            onChange={(event) => setExplanationText(event.target.value)}
            rows={2}
            value={explanationText}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60" disabled={loading} type="submit">
          {loading ? 'Saving...' : 'Add Question'}
        </button>
      </div>
    </form>
  )
}

export default function QuizEditPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])

  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [attemptPage, setAttemptPage] = useState(1)
  const [attemptTotal, setAttemptTotal] = useState(0)

  const [latestUpload, setLatestUpload] = useState('')

  const [detailsForm, setDetailsForm] = useState({
    title: '',
    subject: 'General',
    description: '',
  })

  const tabs = useMemo(
    () => [
      { id: 'details', label: 'Details' },
      { id: 'ai', label: 'AI Generation' },
      { id: 'questions', label: `Questions (${questions.length})` },
      { id: 'attempts', label: 'Attempts' },
    ],
    [questions.length],
  )

  const loadQuiz = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const [quizResponse, questionResponse] = await Promise.all([
        api.get(`/api/quizzes/${id}`),
        api.get(`/api/quizzes/${id}/questions`),
      ])

      setQuiz(quizResponse.data)
      setQuestions(questionResponse.data.items)
      setDetailsForm({
        title: quizResponse.data.title,
        subject: quizResponse.data.subject,
        description: quizResponse.data.description || '',
      })
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadAttempts = useCallback(async (page = 1) => {
    try {
      const response = await api.get(`/api/quizzes/${id}/attempts`, {
        params: {
          page,
          page_size: ATTEMPTS_PAGE_SIZE,
        },
      })
      setAttempts(response.data.items)
      setAttemptPage(response.data.page)
      setAttemptTotal(response.data.total)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to load attempts')
    }
  }, [id])

  useEffect(() => {
    loadQuiz()
    loadAttempts(1)
  }, [loadAttempts, loadQuiz])

  async function saveDetails() {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.patch(`/api/quizzes/${id}`, detailsForm)
      setQuiz(response.data)
      setSuccess('Quiz details updated')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate({ file, mcqCount, openCount, difficulty }) {
    setSaving(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mcq_count', String(mcqCount))
    formData.append('open_count', String(openCount))
    formData.append('difficulty', difficulty)

    try {
      const response = await api.post(`/api/quizzes/${id}/generate`, formData, { timeout: 120000 })
      setQuestions(response.data.questions)
      setLatestUpload(file.name)
      setSuccess(`Generated ${response.data.created_count} questions in ${response.data.llm_latency_ms}ms`)
      setActiveTab('questions')

      // Refetch quiz metadata + attempts from backend so all tabs
      // reflect the freshly-generated state instead of stale data.
      await loadQuiz({ silent: true })
      await loadAttempts(1)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to generate questions')
    } finally {
      setSaving(false)
    }
  }

  async function addQuestion(payload) {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post(`/api/quizzes/${id}/questions`, payload)
      setQuestions((previous) => [...previous, response.data])
      setSuccess('Question added')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to add question')
    } finally {
      setSaving(false)
    }
  }

  async function editQuestion(question) {
    const nextText = window.prompt('Update question text', question.question_text)
    if (!nextText || nextText === question.question_text) {
      return
    }

    try {
      const response = await api.patch(`/api/questions/${question.id}`, {
        question_text: nextText,
      })
      setQuestions((previous) => previous.map((item) => (item.id === question.id ? response.data : item)))
      setSuccess('Question updated')
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to update question')
    }
  }

  async function deleteQuestion(question) {
    if (!window.confirm('Delete this question?')) {
      return
    }

    try {
      await api.delete(`/api/questions/${question.id}`)
      setQuestions((previous) => previous.filter((item) => item.id !== question.id))
      setSuccess('Question deleted')
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to delete question')
    }
  }

  if (loading) {
    return (
      <StudyProLayout>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading quiz editor...</div>
      </StudyProLayout>
    )
  }

  if (!quiz) {
    return (
      <StudyProLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">Quiz not found.</div>
      </StudyProLayout>
    )
  }

  return (
    <StudyProLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Link className="transition-colors hover:text-indigo-600" to="/quizzes">
              Quizzes
            </Link>
            <span className="material-symbols-outlined text-base">chevron_right</span>
            <span>Edit Quiz</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{quiz.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold hover:bg-slate-50" onClick={() => navigate(`/quizzes/${id}/take`)} type="button">
            Preview
          </button>
          <button className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500" onClick={saveDetails} type="button">
            Save Changes
          </button>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}

      <div className="mb-8 flex gap-8 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={[
              'border-b-2 pb-4 font-semibold transition-all',
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-indigo-600',
            ].join(' ')}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-lg font-bold">General Information</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Quiz Title</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                onChange={(event) => setDetailsForm((current) => ({ ...current, title: event.target.value }))}
                value={detailsForm.title}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Subject / Category</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                onChange={(event) => setDetailsForm((current) => ({ ...current, subject: event.target.value }))}
                value={detailsForm.subject}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                onChange={(event) => setDetailsForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                value={detailsForm.description}
              />
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'ai' ? (
        <GenerationPanel
          error={error}
          latestUpload={latestUpload}
          loading={saving}
          onGenerate={handleGenerate}
          success={success}
        />
      ) : null}

      {activeTab === 'questions' ? (
        <div className="space-y-4">
          <NewQuestionForm loading={saving} onCreate={addQuestion} />
          {questions.map((question) => (
            <QuestionCard key={question.id} onDelete={deleteQuestion} onEdit={editQuestion} question={question} />
          ))}
          {!questions.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No questions yet. Generate or add one manually.</div>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'attempts' ? (
        <AttemptsTable
          attempts={attempts}
          onPageChange={(nextPage) => loadAttempts(nextPage)}
          page={attemptPage}
          pageSize={ATTEMPTS_PAGE_SIZE}
          quizId={id}
          total={attemptTotal}
        />
      ) : null}
    </StudyProLayout>
  )
}
