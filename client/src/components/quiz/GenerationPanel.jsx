import { useMemo, useState } from 'react'

export default function GenerationPanel({ onGenerate, loading, latestUpload, error, success }) {
  const [file, setFile] = useState(null)
  const [mcqCount, setMcqCount] = useState(5)
  const [openCount, setOpenCount] = useState(2)
  const [difficulty, setDifficulty] = useState('intermediate')

  const totalCount = useMemo(() => mcqCount + openCount, [mcqCount, openCount])

  const submit = async () => {
    if (!file) {
      return
    }
    await onGenerate({ file, mcqCount, openCount, difficulty })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">AI Quiz Generator</h3>
          <p className="text-sm text-slate-500">Upload source material and generate strict JSON-backed quiz content.</p>
        </div>
        <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-bold uppercase text-indigo-600">Smart Engine</span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Upload Source File (.pdf, .txt, .md)</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {latestUpload ? <p className="mt-2 text-xs text-slate-500">Last uploaded: {latestUpload}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">MCQ Count</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
              type="number"
              min={0}
              max={50}
              value={mcqCount}
              onChange={(event) => setMcqCount(Number(event.target.value))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Open Question Count</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
              type="number"
              min={0}
              max={50}
              value={openCount}
              onChange={(event) => setOpenCount(Number(event.target.value))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Difficulty</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 disabled:opacity-60"
          disabled={loading || !file || totalCount <= 0}
          onClick={submit}
          type="button"
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          {loading ? 'Generating...' : `Generate ${totalCount} Question(s)`}
        </button>

        {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}
