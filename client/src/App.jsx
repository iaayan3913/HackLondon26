import { useState, useEffect } from 'react'
import { MoreVertical, Pencil, Palette, Trash2 } from 'lucide-react'
import './App.css'

const API_URL = 'http://localhost:8000/api'

// Utility function to get file type color
const getFileTypeColor = (fileType) => {
  const colors = {
    'PDF': '#EF4444',
    'PNG': '#8B5CF6',
    'JPG': '#8B5CF6',
    'JPEG': '#8B5CF6',
    'GIF': '#8B5CF6',
    'DOCX': '#2563EB',
    'DOC': '#2563EB',
    'XLSX': '#10B981',
    'XLS': '#10B981',
    'PPTX': '#F59E0B',
    'PPT': '#F59E0B',
    'MP4': '#F59E0B',
    'MP3': '#EC4899',
    'TXT': '#6B7280',
    'ZIP': '#8B5CF6',
  }
  return colors[fileType?.toUpperCase()] || '#6B7280'
}

// Utility function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

function App() {
  const [activeNav, setActiveNav] = useState('dashboard')
  
  // Hub state
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('date')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [currentPath] = useState(['My Files'])
  const [searchQuery, setSearchQuery] = useState('')
  
  // API data state
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  
  // Form state
  const [newFolderName, setNewFolderName] = useState('Untitled Folder')
  const [selectedFiles, setSelectedFiles] = useState([])
  
  // Menu state
  const [openMenu, setOpenMenu] = useState(null)
  // openMenu will be either null or { id: X, type: "folder" | "file" }
  
  // Fetch folders and files on mount and when sort/search changes
  useEffect(() => {
    fetchFolders()
    fetchFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, searchQuery])
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])
  
  // API Functions
  const fetchFolders = async () => {
    try {
      const response = await fetch(`${API_URL}/folders?sort=${sortBy}`)
      if (!response.ok) throw new Error('Failed to fetch folders')
      const data = await response.json()
      setFolders(data.map(folder => ({
        ...folder,
        items: folder.item_count,
        modified: formatDate(folder.updated_at)
      })))
    } catch (err) {
      showError('Failed to load folders')
      console.error(err)
    }
  }
  
  const fetchFiles = async () => {
    try {
      let url = `${API_URL}/files?sort=${sortBy}`
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch files')
      const data = await response.json()
      setFiles(data.map(file => ({
        ...file,
        type: file.file_type,
        size: file.size_display,
        modified: formatDate(file.updated_at),
        color: getFileTypeColor(file.file_type)
      })))
    } catch (err) {
      showError('Failed to load files')
      console.error(err)
    }
  }
  
  const createFolder = async () => {
    try {
      const response = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      })
      if (!response.ok) throw new Error('Failed to create folder')
      await fetchFolders()
      setShowNewFolderModal(false)
      setNewFolderName('Untitled Folder')
    } catch (err) {
      showError('Failed to create folder')
      console.error(err)
    }
  }
  
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select files to upload')
      return
    }
    
    try {
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch(`${API_URL}/files/upload`, {
          method: 'POST',
          body: formData
        })
        if (!response.ok) throw new Error(`Failed to upload ${file.name}`)
      }
      
      await fetchFiles()
      setShowUploadModal(false)
      setSelectedFiles([])
    } catch (err) {
      showError('Failed to upload files')
      console.error(err)
    }
  }
  
  const deleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    
    try {
      const response = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete file')
      await fetchFiles()
    } catch (err) {
      showError('Failed to delete file')
      console.error(err)
    }
  }
  
  const deleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) return
    
    try {
      const response = await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete folder')
      await fetchFolders()
    } catch (err) {
      showError('Failed to delete folder')
      console.error(err)
    }
  }
  
  const downloadFile = (fileId) => {
    window.open(`${API_URL}/files/${fileId}/download`, '_blank')
  }
  
  const showError = (message) => {
    setError(message)
    setTimeout(() => setError(null), 3000)
  }
  
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files))
  }

  const handleRename = (item) => {
    setOpenMenu(null)
    // TODO: Open rename modal
    console.log('Rename:', item.name)
  }

  const handleChangeColour = (folder) => {
    setOpenMenu(null)
    // TODO: Open color picker modal
    console.log('Change colour:', folder.name)
  }

  const handleDelete = (item) => {
    setOpenMenu(null)
    if (item.items !== undefined) {
      // It's a folder
      deleteFolder(item.id)
    } else {
      // It's a file
      deleteFile(item.id)
    }
  }

  return (
    <div className="dashboard">
      {/* Error Toast */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#EF4444',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {error}
        </div>
      )}

      {/* Sidebar */}
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
          <button className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveNav('dashboard')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </button>
          <button className={`nav-item ${activeNav === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveNav('flashcards')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 3h10c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
            </svg>
            Flashcards
          </button>
          <button className={`nav-item ${activeNav === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveNav('quizzes')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Quizzes
          </button>
          <button className={`nav-item ${activeNav === 'transcription' ? 'active' : ''}`} onClick={() => setActiveNav('transcription')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Transcription
          </button>
          <button className={`nav-item ${activeNav === 'focus' ? 'active' : ''}`} onClick={() => setActiveNav('focus')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Focus Zone
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-container">
        {/* Top Navbar */}
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
                <div className="user-name">Alex Johnson</div>
              </div>
              <div className="user-avatar">AJ</div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="content-area">
          {/* Welcome Header */}
          <div className="welcome-header">
            <div>
              <h1 className="welcome-title">Welcome back, Alex! 👋</h1>
              <p className="welcome-subtitle">
                You've studied for <span className="highlight">4.5 hours</span> this week
              </p>
            </div>
            <button className="weekly-report-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
              Weekly Report
            </button>
          </div>

          {/* Stat Cards */}
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Hours</div>
                <div className="stat-value">24.5h</div>
                <div className="stat-change positive">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  +12% from last week
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Mastered Cards</div>
                <div className="stat-value">1,284</div>
                <div className="stat-change positive">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  +45 today
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Quiz Average</div>
                <div className="stat-value">92%</div>
                <div className="stat-change negative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  -2% from last week
                </div>
              </div>
            </div>
          </div>

          {/* Recent Flashcard Decks */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Recent Flashcard Decks</h2>
              <a href="#" className="view-all-link">View all decks →</a>
            </div>
            <div className="deck-grid">
              <div className="deck-card create-deck-card">
                <svg className="create-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <div className="create-text">Create New Deck</div>
              </div>

              <div className="deck-card">
                <div className="deck-header">
                  <span className="deck-badge badge-medicine">Medicine</span>
                  <button className="deck-menu-button">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>
                <h3 className="deck-title">Human Anatomy II</h3>
                <div className="deck-info">
                  <span>128 cards</span>
                  <span className="deck-time">Last practiced 2h ago</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill progress-green" style={{ width: '65%' }}></div>
                  </div>
                  <span className="progress-label">65%</span>
                </div>
              </div>

              <div className="deck-card">
                <div className="deck-header">
                  <span className="deck-badge badge-biology">Biology</span>
                  <button className="deck-menu-button">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>
                <h3 className="deck-title">Microbiology Basic</h3>
                <div className="deck-info">
                  <span>54 cards</span>
                  <span className="deck-time">Last practiced 5h ago</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill progress-blue" style={{ width: '30%' }}></div>
                  </div>
                  <span className="progress-label">30%</span>
                </div>
              </div>

              <div className="deck-card">
                <div className="deck-header">
                  <span className="deck-badge badge-chemistry">Chemistry</span>
                  <button className="deck-menu-button">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>
                <h3 className="deck-title">Organic Compounds</h3>
                <div className="deck-info">
                  <span>89 cards</span>
                  <span className="deck-time">Last practiced 1d ago</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill progress-green" style={{ width: '88%' }}></div>
                  </div>
                  <span className="progress-label">88%</span>
                </div>
              </div>
            </div>
          </section>

          {/* My Files Section */}
          <section className="section hub-section">
            <div className="hub-container">
              <div className="hub-header">
                <div className="hub-title-wrapper">
                  <svg className="hub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <h2 className="section-title">My Files</h2>
                </div>
                <div className="hub-header-actions">
                  <button className="hub-button hub-button-outline" onClick={() => setShowNewFolderModal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      <line x1="12" y1="10" x2="12" y2="16" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                    </svg>
                    New Folder
                  </button>
                  <button className="hub-button hub-button-primary" onClick={() => setShowUploadModal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Files
                  </button>
                </div>
              </div>

              {/* Hub Toolbar */}
              <div className="hub-toolbar">
                <div className="hub-search">
                  <svg className="hub-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search files and folders..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="hub-toolbar-actions">
                  <div className="view-toggle">
                    <button 
                      className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </button>
                    <button 
                      className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <select className="sort-dropdown" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Sort by: Name</option>
                    <option value="date">Sort by: Date</option>
                    <option value="size">Sort by: Size</option>
                    <option value="type">Sort by: Type</option>
                  </select>
                </div>
              </div>

              {/* Breadcrumb */}
              <div className="breadcrumb">
                {currentPath.map((crumb, index) => (
                  <span key={index}>
                    <button className="breadcrumb-item">{crumb}</button>
                    {index < currentPath.length - 1 && <span className="breadcrumb-separator">›</span>}
                  </span>
                ))}
              </div>

            {/* Hub Content - Grid or List View */}
            {viewMode === 'grid' ? (
              <div className="hub-content">
                {/* Combined Folders and Files Grid */}
                {(folders.length > 0 || files.length > 0) && (
                  <div className="hub-grid">
                    {/* Folders */}
                    {folders.map(folder => (
                      <div key={folder.id} className="hub-item folder-item" style={{ position: "relative", overflow: "visible" }}>
                        <div className="hub-item-header">
                          <div className="folder-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenu(openMenu?.id === folder.id && openMenu?.type === "folder" 
                                ? null 
                                : { id: folder.id, type: "folder" })
                            }}
                            style={{
                              position: "absolute", top: "12px", right: "12px",
                              width: "28px", height: "28px", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              borderRadius: "6px", border: "none", background: "none",
                              cursor: "pointer", color: "#9ca3af"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                            title="Folder options"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {/* Folder Menu */}
                          {openMenu?.id === folder.id && openMenu?.type === "folder" && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: "absolute",
                                top: "40px",
                                right: "12px",
                                zIndex: 9999,
                                background: "white",
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                                padding: "4px 0",
                                width: "176px",
                                overflow: "hidden"
                              }}
                            >
                              <button
                                onClick={() => handleRename(folder)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "12px",
                                  width: "100%", padding: "10px 16px", fontSize: "14px",
                                  color: "#374151", background: "none", border: "none",
                                  cursor: "pointer", textAlign: "left"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <Pencil size={16} color="#9ca3af" /> Rename
                              </button>
                              <button
                                onClick={() => handleChangeColour(folder)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "12px",
                                  width: "100%", padding: "10px 16px", fontSize: "14px",
                                  color: "#374151", background: "none", border: "none",
                                  cursor: "pointer", textAlign: "left"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <Palette size={16} color="#9ca3af" /> Change Colour
                              </button>
                              <div style={{ borderTop: "1px solid #f3f4f6", margin: "4px 0" }} />
                              <button
                                onClick={() => handleDelete(folder)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "12px",
                                  width: "100%", padding: "10px 16px", fontSize: "14px",
                                  color: "#ef4444", background: "none", border: "none",
                                  cursor: "pointer", textAlign: "left"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="hub-item-body">
                          <h3 className="hub-item-name">{folder.name}</h3>
                          <div className="hub-item-meta">
                            <span>{folder.items} items</span>
                            <span className="hub-item-date">{folder.modified}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Files */}
                    {files.map(file => (
                      <div key={file.id} className="hub-item file-item" style={{ position: "relative", overflow: "visible" }} onDoubleClick={() => downloadFile(file.id, file.name)}>
                        <div className="hub-item-header">
                          <div className="file-icon" style={{ backgroundColor: file.color }}>
                            <span className="file-type-text">{file.type}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenu(openMenu?.id === file.id && openMenu?.type === "file" 
                                ? null 
                                : { id: file.id, type: "file" })
                            }}
                            style={{
                              position: "absolute", top: "12px", right: "12px",
                              width: "28px", height: "28px", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              borderRadius: "6px", border: "none", background: "none",
                              cursor: "pointer", color: "#9ca3af"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                            title="File options"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {/* File Menu */}
                          {openMenu?.id === file.id && openMenu?.type === "file" && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: "absolute",
                                top: "40px",
                                right: "12px",
                                zIndex: 9999,
                                background: "white",
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                                padding: "4px 0",
                                width: "176px",
                                overflow: "hidden"
                              }}
                            >
                              <button
                                onClick={() => handleRename(file)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "12px",
                                  width: "100%", padding: "10px 16px", fontSize: "14px",
                                  color: "#374151", background: "none", border: "none",
                                  cursor: "pointer", textAlign: "left"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <Pencil size={16} color="#9ca3af" /> Rename
                              </button>
                              <div style={{ borderTop: "1px solid #f3f4f6", margin: "4px 0" }} />
                              <button
                                onClick={() => handleDelete(file)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "12px",
                                  width: "100%", padding: "10px 16px", fontSize: "14px",
                                  color: "#ef4444", background: "none", border: "none",
                                  cursor: "pointer", textAlign: "left"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="hub-item-body">
                          <h3 className="hub-item-name">{file.name}</h3>
                          <div className="hub-item-meta">
                            <span className="file-badge" style={{ backgroundColor: file.color + '20', color: file.color }}>
                              {file.type}
                            </span>
                            <span>{file.size}</span>
                          </div>
                          <div className="hub-item-date">{file.modified}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* List View */
              <div className="hub-list-view">
                <table className="hub-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Modified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folders.map(folder => (
                      <tr key={folder.id} className="hub-table-row folder-row">
                        <td><input type="checkbox" /></td>
                        <td>
                          <div className="table-cell-content">
                            <div className="folder-icon-small">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                              </svg>
                            </div>
                            <span>{folder.name}</span>
                          </div>
                        </td>
                        <td>Folder</td>
                        <td>{folder.items} items</td>
                        <td>{folder.modified}</td>
                        <td>
                          <button 
                            className="table-action-button"
                            onClick={() => deleteFolder(folder.id)}
                            title="Delete folder"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {files.map(file => (
                      <tr key={file.id} className="hub-table-row file-row" onDoubleClick={() => downloadFile(file.id, file.name)}>
                        <td><input type="checkbox" /></td>
                        <td>
                          <div className="table-cell-content">
                            <div className="file-icon-small" style={{ backgroundColor: file.color }}>
                              {file.type}
                            </div>
                            <span>{file.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="file-badge-small" style={{ backgroundColor: file.color + '20', color: file.color }}>
                            {file.type}
                          </span>
                        </td>
                        <td>{file.size}</td>
                        <td>{file.modified}</td>
                        <td>
                          <button 
                            className="table-action-button"
                            onClick={() => deleteFile(file.id)}
                            title="Delete file"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </section>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Upload Files</h2>
                  <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="upload-dropzone">
                  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="upload-text">Drag & drop files here or click to browse</p>
                  <p className="upload-subtext">Supports PDF, DOCX, PNG, JPG, MP4 and more</p>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', marginTop: '1rem', display: 'inline-block' }}>
                    <button className="modal-button modal-button-secondary" onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('file-upload').click()
                    }}>
                      Browse Files
                    </button>
                  </label>
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <p>{selectedFiles.length} file(s) selected</p>
                      <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                        {selectedFiles.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="modal-button modal-button-secondary" onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFiles([])
                  }}>
                    Cancel
                  </button>
                  <button className="modal-button modal-button-primary" onClick={uploadFiles}>
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Folder Modal */}
          {showNewFolderModal && (
            <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
              <div className="modal-content modal-content-small" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Create New Folder</h2>
                  <button className="modal-close" onClick={() => setShowNewFolderModal(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  <label className="input-label">Folder Name</label>
                  <input 
                    type="text" 
                    className="modal-input" 
                    placeholder="Untitled Folder" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button className="modal-button modal-button-secondary" onClick={() => setShowNewFolderModal(false)}>
                    Cancel
                  </button>
                  <button className="modal-button modal-button-primary" onClick={createFolder}>
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
