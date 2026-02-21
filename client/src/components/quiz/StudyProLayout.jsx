import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/', icon: 'dashboard', state: { activeNav: 'dashboard' } },
  { label: 'Flashcards', to: '/', icon: 'style', state: { activeNav: 'flashcards' } },
  { label: 'Quizzes', to: '/quizzes', icon: 'quiz' },
  { label: 'Transcription', to: '/', icon: 'transcribe', state: { activeNav: 'transcription' } },
  { label: 'Focus Zone', to: '/', icon: 'timer', state: { activeNav: 'focus' } },
]

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-3 p-6">
        <div className="rounded-lg bg-indigo-600 p-1.5 text-white">
          <span className="material-symbols-outlined block">menu_book</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">StudyPro</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Academic Suite</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            state={item.state}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all',
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-600 hover:bg-slate-50',
              ].join(' ')
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Pro Plan</p>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[85%] bg-indigo-600" />
          </div>
          <p className="text-xs text-slate-600">8.5GB of 10GB used</p>
        </div>
      </div>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur-md">
      <div className="relative w-full max-w-xl">
        <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">search</span>
        <input
          className="w-full rounded-full border-none bg-slate-100 py-2 pr-4 pl-10 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Search for quizzes, notes, or folders..."
          type="text"
        />
      </div>
      <div className="ml-8 flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-none">Test User</p>
          <p className="mt-1 text-[10px] text-slate-500">Hackathon Profile</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">TU</div>
      </div>
    </header>
  )
}

export default function StudyProLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Topbar />
          <div className="mx-auto w-full max-w-7xl p-8">{children}</div>
          <div className="px-8 pb-8 text-xs text-slate-500">
            <Link className="font-semibold text-indigo-600 hover:underline" to="/">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
