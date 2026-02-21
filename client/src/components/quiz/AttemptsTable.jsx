import { Link } from 'react-router-dom'

export default function AttemptsTable({ quizId, attempts, page, pageSize, total, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Started</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Completed</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Score</th>
            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {attempts.map((attempt) => (
            <tr key={attempt.id} className="transition-colors hover:bg-slate-50/80">
              <td className="px-6 py-4">
                <span
                  className={[
                    'rounded-lg px-2.5 py-1 text-xs font-bold uppercase',
                    attempt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                  ].join(' ')}
                >
                  {attempt.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{new Date(attempt.started_at).toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : 'Not completed'}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-800">{attempt.percentage.toFixed(1)}%</td>
              <td className="px-6 py-4 text-right">
                {attempt.status === 'completed' ? (
                  <Link className="text-sm font-semibold text-indigo-600 hover:underline" to={`/quizzes/${quizId}/results?attempt=${attempt.id}`}>
                    View Details
                  </Link>
                ) : (
                  <Link className="text-sm font-semibold text-indigo-600 hover:underline" to={`/quizzes/${quizId}/take?attempt=${attempt.id}`}>
                    Resume
                  </Link>
                )}
              </td>
            </tr>
          ))}
          {!attempts.length ? (
            <tr>
              <td className="px-6 py-6 text-sm text-slate-500" colSpan={5}>
                No attempts yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <span>
          Showing {(page - 1) * pageSize + 1} - {Math.min(total, page * pageSize)} of {total}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Prev
          </button>
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-50"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
