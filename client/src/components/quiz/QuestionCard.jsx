export default function QuestionCard({ question, onEdit, onDelete }) {
  const isMcq = question.type === 'mcq'

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Question {question.id}
            </span>
            <span
              className={[
                'rounded px-2 py-1 text-xs font-bold uppercase',
                isMcq ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700',
              ].join(' ')}
            >
              {isMcq ? 'Multiple Choice' : 'Open'}
            </span>
          </div>
          <h4 className="text-lg font-semibold leading-relaxed">{question.question_text}</h4>

          {isMcq && Array.isArray(question.options) ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {question.options.map((option) => (
                <div
                  key={option.key}
                  className={[
                    'flex items-center gap-3 rounded-xl border p-3',
                    question.correct_option === option.key
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      question.correct_option === option.key ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700',
                    ].join(' ')}
                  >
                    {option.key}
                  </span>
                  <span className="text-sm">{option.text}</span>
                </div>
              ))}
            </div>
          ) : null}

          {question.explanation?.text ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Explanation</p>
              <p className="mt-1 text-sm text-slate-700">{question.explanation.text}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <button
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
            onClick={() => onEdit(question)}
            type="button"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
            onClick={() => onDelete(question)}
            type="button"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
