import { useNavigate } from 'react-router-dom'

import '../App.css'

function NavIcon({ children }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {children}
    </svg>
  )
}

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    state: { activeNav: 'dashboard' },
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    path: '/',
    state: { activeNav: 'flashcards' },
    icon: (
      <>
        <path d="M7 3h10c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
      </>
    ),
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    path: '/quizzes',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
  {
    id: 'transcription',
    label: 'Transcription',
    path: '/',
    state: { activeNav: 'transcription' },
    icon: (
      <>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </>
    ),
  },
]

export default function AppShell({ activeNav, children }) {
  const navigate = useNavigate()

  const handleNavigation = (item) => {
    if (item.path === '/') {
      navigate('/', { state: item.state })
      return
    }
    navigate(item.path)
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <div className="logo-text">
              <div className="logo-title">StudyPro</div>
              <div className="logo-subtitle">Academic Suite</div>
            </div>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item)}
              type="button"
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-container">
        <header className="top-navbar">
          <div className="search-bar">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search for flashcards, notes, or files..." />
          </div>
          <div className="navbar-actions">
            <div className="user-profile">
              <div className="user-info">
                <div className="user-name">Sir Al-Amin</div>
              </div>
              <div className="user-avatar">SA</div>
            </div>
          </div>
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
