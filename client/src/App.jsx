import { useState } from 'react'
import './App.css'
import Flashcards from './Flashcards'

function App() {
  const [activeNav, setActiveNav] = useState('transcription')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('name')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [currentPath] = useState(['My Files'])

  const folders = [
    { id: 1, name: 'Biology Notes', items: 24, modified: '2 days ago' },
    { id: 2, name: 'Anatomy Diagrams', items: 15, modified: '5 days ago' },
    { id: 3, name: 'Past Papers', items: 8, modified: '1 week ago' },
    { id: 4, name: 'Lecture Recordings', items: 12, modified: '3 days ago' },
  ]

  const files = [
    { id: 5, name: "Gray's Anatomy Ch.1.pdf", type: 'PDF', size: '2.4 MB', modified: '1 day ago', color: '#EF4444' },
    { id: 6, name: 'Cell Membrane Diagram.png', type: 'PNG', size: '856 KB', modified: '2 days ago', color: '#8B5CF6' },
    { id: 7, name: 'Pharmacology Notes.docx', type: 'DOCX', size: '124 KB', modified: '3 days ago', color: '#2563EB' },
    { id: 8, name: 'Neuroscience Lecture.mp4', type: 'MP4', size: '45.2 MB', modified: '4 days ago', color: '#F59E0B' },
  ]

  return (
    <div className={activeNav === 'transcription' ? 'flex flex-col min-h-screen bg-slate-50' : 'dashboard'}>
      {/* ===== TRANSCRIPTION STUDIO (Unified Layout) ===== */}
      {activeNav === 'transcription' && (
        <>
          <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
            <div className="w-60 flex-shrink-0"></div>

            <div className="flex-1 max-w-xl mx-auto relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"></circle>
                <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
              </svg>
              <input
                type="text"
                placeholder="Search recordings, transcripts, or topics..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg" aria-label="Notifications">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 17H5L6.4 15.6C6.775 15.225 7 14.7163 7 14.1858V10C7 7.23858 9.23858 5 12 5C14.7614 5 17 7.23858 17 10V14.1858C17 14.7163 17.225 15.225 17.6 15.6L19 17H15Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path>
                  <path d="M10.5 19C10.8 19.6 11.4 20 12 20C12.6 20 13.2 19.6 13.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                </svg>
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg" aria-label="Settings">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke="currentColor" strokeWidth="1.8"></path>
                  <path d="M19.4 15A1.7 1.7 0 0 0 20.1 16.9L20.2 17C20.6 17.4 20.6 18.1 20.2 18.5L18.5 20.2C18.1 20.6 17.4 20.6 17 20.2L16.9 20.1A1.7 1.7 0 0 0 15 19.4C14.56 19.59 14.25 19.99 14.2 20.47V20.8C14.2 21.35 13.75 21.8 13.2 21.8H10.8C10.25 21.8 9.8 21.35 9.8 20.8V20.6C9.77 20.09 9.45 19.63 9 19.4A1.7 1.7 0 0 0 7.1 20.1L7 20.2C6.6 20.6 5.9 20.6 5.5 20.2L3.8 18.5C3.4 18.1 3.4 17.4 3.8 17L3.9 16.9A1.7 1.7 0 0 0 4.6 15C4.41 14.56 4.01 14.25 3.53 14.2H3.2C2.65 14.2 2.2 13.75 2.2 13.2V10.8C2.2 10.25 2.65 9.8 3.2 9.8H3.4C3.91 9.77 4.37 9.45 4.6 9A1.7 1.7 0 0 0 3.9 7.1L3.8 7C3.4 6.6 3.4 5.9 3.8 5.5L5.5 3.8C5.9 3.4 6.6 3.4 7 3.8L7.1 3.9A1.7 1.7 0 0 0 9 4.6C9.44 4.41 9.75 4.01 9.8 3.53V3.2C9.8 2.65 10.25 2.2 10.8 2.2H13.2C13.75 2.2 14.2 2.65 14.2 3.2V3.4C14.23 3.91 14.55 4.37 15 4.6A1.7 1.7 0 0 0 16.9 3.9L17 3.8C17.4 3.4 18.1 3.4 18.5 3.8L20.2 5.5C20.6 5.9 20.6 6.6 20.2 7L20.1 7.1A1.7 1.7 0 0 0 19.4 9C19.59 9.44 19.99 9.75 20.47 9.8H20.8C21.35 9.8 21.8 10.25 21.8 10.8V13.2C21.8 13.75 21.35 14.2 20.8 14.2H20.6C20.09 14.23 19.63 14.55 19.4 15Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"></path>
                </svg>
              </button>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-sm font-bold text-slate-600">AJ</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Alex Johnson</p>
                  <p className="text-xs text-slate-500">Medical Student</p>
                </div>
              </div>
            </div>
          </nav>

          <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 bg-white border-r border-slate-200 flex flex-col p-4 z-40">
            <div className="flex items-center gap-3 px-3 py-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4H16C17.1 4 18 4.9 18 6V19L15 17.5L12 19L9 17.5L6 19V6C6 4.9 6.9 4 8 4Z" fill="currentColor"></path>
                  <path d="M9 8H15" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-800">StudyPro</span>
                <span className="text-xs text-slate-500">Academic Suite</span>
              </div>
            </div>

            <button onClick={() => setActiveNav('dashboard')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors mb-1">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"></rect>
                <rect x="12" y="2" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"></rect>
                <rect x="2" y="12" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"></rect>
                <rect x="12" y="12" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"></rect>
              </svg>
              <span>Dashboard</span>
            </button>

            <button onClick={() => setActiveNav('flashcards')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors mb-1">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6.5L10 3L16 6.5L10 10L4 6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path>
                <path d="M4 10.5L10 7L16 10.5L10 14L4 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path>
                <path d="M4 14.5L10 11L16 14.5L10 18L4 14.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path>
              </svg>
              <span>Flashcards</span>
            </button>

            <button onClick={() => setActiveNav('quizzes')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors mb-1">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="2.5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"></rect>
                <path d="M7 6H13M7 9.5H13M7 13H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                <path d="M8 2.5H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
              </svg>
              <span>Quizzes</span>
            </button>

            <button onClick={() => setActiveNav('transcription')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-600 bg-blue-50 mb-1">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3C11.7 3 13 4.3 13 6V9.8C13 11.5 11.7 12.8 10 12.8C8.3 12.8 7 11.5 7 9.8V6C7 4.3 8.3 3 10 3Z" stroke="currentColor" strokeWidth="1.8"></path>
                <path d="M4.5 9.8C4.5 12.7 6.9 15.1 9.8 15.1H10.2C13.1 15.1 15.5 12.7 15.5 9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                <path d="M10 15.1V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
              </svg>
              <span>Transcription</span>
            </button>

            <button onClick={() => setActiveNav('focus')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors mb-1">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8"></circle>
                <path d="M10 6V10L12.8 11.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Focus Zone</span>
            </button>
          </aside>

          <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[300px] bg-slate-50 border-l border-slate-200 p-5 overflow-y-auto z-40 flex flex-col gap-4">
            <div className="bg-[#0F172A] rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2.5C7.24 2.5 5 4.74 5 7.5C5 9.16 5.81 10.63 7.05 11.55C7.66 12 8 12.72 8 13.5V14H12V13.5C12 12.72 12.34 12 12.95 11.55C14.19 10.63 15 9.16 15 7.5C15 4.74 12.76 2.5 10 2.5Z" fill="currentColor"></path>
                  <path d="M8 16H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                  <path d="M8.5 18H11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                </svg>
                <h3 className="text-base font-bold">Quick Tips</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Improve transcript accuracy and speed with these recommended studio workflows.</p>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0 mt-0.5">01</div>
                <p className="text-xs text-slate-300 leading-relaxed"><span className="font-bold text-white">Use clear audio:</span> Upload files with minimal background noise for best recognition quality.</p>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0 mt-0.5">02</div>
                <p className="text-xs text-slate-300 leading-relaxed"><span className="font-bold text-white">Label speakers:</span> Add speaker tags during review to organize notes for faster studying.</p>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0 mt-0.5">03</div>
                <p className="text-xs text-slate-300 leading-relaxed"><span className="font-bold text-white">Export smartly:</span> Download final transcripts and convert key points into flashcards.</p>
              </div>

              <button className="w-full mt-2 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors">View Full Guide</button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Studio Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Hours Processed</span>
                  <span className="text-2xl font-bold text-blue-600">124.5</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Total Files</span>
                  <span className="text-2xl font-bold text-slate-900">42</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="ml-60 mr-[300px] mt-16 p-8 min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Transcription Studio</h1>
                <p className="text-sm text-slate-500 mt-1">Upload lectures, record sessions, and manage transcript history in one place.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                  <circle cx="14.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.6"></circle>
                  <path d="M8 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                  <circle cx="5.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.6"></circle>
                  <path d="M3 15H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                  <circle cx="14.5" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.6"></circle>
                </svg>
                <span>Filter View</span>
              </button>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-7 flex items-center justify-between mb-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-900">New Recording</h2>
                <p className="text-sm text-slate-500 max-w-sm">Start a live session or upload an existing file to generate accurate transcripts for study and revision.</p>
                <div className="flex flex-col gap-3 mt-2">
                  <button className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors w-fit">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 14.5H14C16.2091 14.5 18 12.7091 18 10.5C18 8.53434 16.5834 6.89952 14.7147 6.56089C14.0733 4.51525 12.1662 3 9.9 3C7.30928 3 5.2 5.10928 5.2 7.7C3.93877 8.1194 3 9.30957 3 10.7C3 12.4397 4.4103 13.85 6.15 13.85H6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M10 9V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                      <path d="M7.5 11.5L10 9L12.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>Upload Audio/Video</span>
                  </button>
                  <button className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors w-fit text-slate-800">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Start Live Session</span>
                  </button>
                </div>
              </div>

              <div className="w-36 h-28 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 17V7.5C9 6.12 10.12 5 11.5 5C12.88 5 14 6.12 14 7.5V16.3C14 17.79 12.79 19 11.3 19C9.81 19 8.6 17.79 8.6 16.3V8.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                  <path d="M16 10L20 8V16L16 14V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path>
                </svg>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">Transcription History</h2>
                <a href="#" className="text-sm text-blue-600 hover:underline font-medium">See all activity</a>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">File Name</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Duration</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 2.8H11.5L15 6.3V16.2C15 16.97 14.37 17.6 13.6 17.6H6.4C5.63 17.6 5 16.97 5 16.2V4.2C5 3.43 5.63 2.8 6.4 2.8H6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path>
                            <path d="M11.5 2.8V6.3H15" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-800">Biology_Lecture_Week4.mp3</span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>
                    </td>
                    <td className="py-4 px-3"><span className="text-sm text-slate-600">45:12</span></td>
                    <td className="py-4 px-3"><span className="text-sm text-slate-600">Feb 20, 2026</span></td>
                    <td className="py-4 px-3">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md" aria-label="More actions">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="4" cy="10" r="1.5" fill="currentColor"></circle>
                          <circle cx="10" cy="10" r="1.5" fill="currentColor"></circle>
                          <circle cx="16" cy="10" r="1.5" fill="currentColor"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>

                  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-violet-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3.5C11.3 3.5 12.35 4.55 12.35 5.85V9.45C12.35 10.75 11.3 11.8 10 11.8C8.7 11.8 7.65 10.75 7.65 9.45V5.85C7.65 4.55 8.7 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.7"></path>
                            <path d="M5.4 9.6C5.4 12.03 7.37 14 9.8 14H10.2C12.63 14 14.6 12.03 14.6 9.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"></path>
                            <path d="M10 14V16.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"></path>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-800">Chemistry_Lab_Notes.wav</span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
                        <svg className="w-4 h-4 spinner" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"></circle>
                          <path d="M17 10C17 6.134 13.866 3 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                        </svg>
                        Transcribing...
                      </span>
                    </td>
                    <td className="py-4 px-3"><span className="text-sm text-slate-600">18:47</span></td>
                    <td className="py-4 px-3"><span className="text-sm text-slate-600">Feb 21, 2026</span></td>
                    <td className="py-4 px-3">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md" aria-label="More actions">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="4" cy="10" r="1.5" fill="currentColor"></circle>
                          <circle cx="10" cy="10" r="1.5" fill="currentColor"></circle>
                          <circle cx="16" cy="10" r="1.5" fill="currentColor"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>

                  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-pink-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-pink-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7"></rect>
                            <path d="M8 7.5L13 10L8 12.5V7.5Z" fill="currentColor"></path>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-800">Physics_Seminar.mp4</span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Error</span>
                    </td>
                    <td className="py-4 px-3"><span className="text-sm text-slate-600">52:03</span></td>
                    <td className="py-4 px-3"><span className="text-sm text-slate-600">Feb 19, 2026</span></td>
                    <td className="py-4 px-3">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md" aria-label="More actions">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="4" cy="10" r="1.5" fill="currentColor"></circle>
                          <circle cx="10" cy="10" r="1.5" fill="currentColor"></circle>
                          <circle cx="16" cy="10" r="1.5" fill="currentColor"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </main>
        </>
      )}

      {/* ===== DASHBOARD PAGE (from main branch) ===== */}
      {activeNav === 'dashboard' && (
        <>
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
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </button>
              <button className={`nav-item ${activeNav === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveNav('flashcards')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 3h10c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z" />
                  <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" />
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
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
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

          <div className="main-container">
            <header className="top-navbar">
              <div className="search-bar">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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

            <main className="content-area">
              <div className="welcome-header">
                <div>
                  <h1 className="welcome-title">Welcome back, Alex! 👋</h1>
                  <p className="welcome-subtitle">
                    You've studied for <span className="highlight">4.5 hours</span> this week
                  </p>
                </div>
                <button className="weekly-report-button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  </svg>
                  Weekly Report
                </button>
              </div>

              <div className="stat-cards">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Hours</div>
                    <div className="stat-value">24.5h</div>
                    <div className="stat-change positive">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                      +12% from last week
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Mastered Cards</div>
                    <div className="stat-value">1,284</div>
                    <div className="stat-change positive">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      -2% from last week
                    </div>
                  </div>
                </div>
              </div>

              <section className="section">
                <div className="section-header">
                  <h2 className="section-title">My Files & Folders</h2>
                  <div className="files-actions">
                    <button className="view-mode-button" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {viewMode === 'grid' ? (
                          <>
                            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                          </>
                        ) : (
                          <>
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                          </>
                        )}
                      </svg>
                    </button>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                      <option value="name">Sort by Name</option>
                      <option value="modified">Sort by Recently Modified</option>
                      <option value="size">Sort by Size</option>
                    </select>
                    <button className="action-button" onClick={() => setShowUploadModal(true)}>Upload Files</button>
                    <button className="action-button primary" onClick={() => setShowNewFolderModal(true)}>New Folder</button>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="files-grid">
                    {folders.map(folder => (
                      <div key={folder.id} className="file-card folder-card">
                        <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <h3 className="file-name">{folder.name}</h3>
                        <p className="file-meta">{folder.items} items &bull; {folder.modified}</p>
                        <button className="file-menu">
                          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                        </button>
                      </div>
                    ))}
                    {files.map(file => (
                      <div key={file.id} className="file-card">
                        <div className="file-icon-box" style={{ backgroundColor: file.color + '20', color: file.color }}>
                          <span className="file-type">{file.type}</span>
                        </div>
                        <h3 className="file-name">{file.name}</h3>
                        <p className="file-meta">{file.size} &bull; {file.modified}</p>
                        <button className="file-menu">
                          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="files-list">
                    <div className="list-header">
                      <div className="col-name">Name</div>
                      <div className="col-size">Size</div>
                      <div className="col-modified">Modified</div>
                      <div className="col-actions">Actions</div>
                    </div>
                    {folders.map(folder => (
                      <div key={folder.id} className="list-row">
                        <div className="col-name">
                          <svg className="list-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>{folder.name}</span>
                        </div>
                        <div className="col-size">-</div>
                        <div className="col-modified">{folder.modified}</div>
                        <div className="col-actions">
                          <button className="file-menu">
                            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {files.map(file => (
                      <div key={file.id} className="list-row">
                        <div className="col-name">
                          <div className="list-icon-box" style={{ backgroundColor: file.color + '20', color: file.color }}>
                            {file.type}
                          </div>
                          <span>{file.name}</span>
                        </div>
                        <div className="col-size">{file.size}</div>
                        <div className="col-modified">{file.modified}</div>
                        <div className="col-actions">
                          <button className="file-menu">
                            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section-header">
                  <h2 className="section-title">Recent Flashcard Decks</h2>
                  <button className="view-all-link" onClick={() => setActiveNav('flashcards')}>View all decks →</button>
                </div>
                <div className="deck-grid">
                  <div className="deck-card create-deck-card" onClick={() => setActiveNav('flashcards')}>
                    <svg className="create-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <div className="create-text">Create New Deck</div>
                  </div>
                  <div className="deck-card">
                    <div className="deck-header">
                      <span className="deck-badge badge-medicine">Medicine</span>
                      <button className="deck-menu-button"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
                    </div>
                    <h3 className="deck-title">Human Anatomy II</h3>
                    <div className="deck-info"><span>128 cards</span><span className="deck-time">Last practiced 2h ago</span></div>
                    <div className="progress-container">
                      <div className="progress-bar"><div className="progress-fill progress-green" style={{ width: '65%' }}></div></div>
                      <span className="progress-label">65%</span>
                    </div>
                  </div>
                  <div className="deck-card">
                    <div className="deck-header">
                      <span className="deck-badge badge-biology">Biology</span>
                      <button className="deck-menu-button"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
                    </div>
                    <h3 className="deck-title">Microbiology Basic</h3>
                    <div className="deck-info"><span>54 cards</span><span className="deck-time">Last practiced 5h ago</span></div>
                    <div className="progress-container">
                      <div className="progress-bar"><div className="progress-fill progress-blue" style={{ width: '30%' }}></div></div>
                      <span className="progress-label">30%</span>
                    </div>
                  </div>
                  <div className="deck-card">
                    <div className="deck-header">
                      <span className="deck-badge badge-chemistry">Chemistry</span>
                      <button className="deck-menu-button"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
                    </div>
                    <h3 className="deck-title">Organic Compounds</h3>
                    <div className="deck-info"><span>89 cards</span><span className="deck-time">Last practiced 1d ago</span></div>
                    <div className="progress-container">
                      <div className="progress-bar"><div className="progress-fill progress-green" style={{ width: '88%' }}></div></div>
                      <span className="progress-label">88%</span>
                    </div>
                  </div>
                </div>
              </section>

              {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Upload Files</h2>
                      <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <div className="upload-dropzone">
                      <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="upload-text">Drag & drop files here or click to browse</p>
                      <p className="upload-subtext">Supports PDF, DOCX, PNG, JPG, MP4 and more</p>
                    </div>
                    <div className="modal-footer">
                      <button className="modal-button modal-button-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                      <button className="modal-button modal-button-primary">Upload</button>
                    </div>
                  </div>
                </div>
              )}

              {showNewFolderModal && (
                <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
                  <div className="modal-content modal-content-small" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Create New Folder</h2>
                      <button className="modal-close" onClick={() => setShowNewFolderModal(false)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <div className="modal-body">
                      <label className="input-label">Folder Name</label>
                      <input type="text" className="modal-input" placeholder="Untitled Folder" defaultValue="Untitled Folder" />
                    </div>
                    <div className="modal-footer">
                      <button className="modal-button modal-button-secondary" onClick={() => setShowNewFolderModal(false)}>Cancel</button>
                      <button className="modal-button modal-button-primary" onClick={() => setShowNewFolderModal(false)}>Create</button>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </>
      )}

      {/* ===== FLASHCARDS PAGE ===== */}
      {activeNav === 'flashcards' && (
        <>
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
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </button>
              <button className={`nav-item ${activeNav === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveNav('flashcards')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 3h10c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z" />
                  <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" />
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
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
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

          <div className="main-container" style={{ marginLeft: '230px', width: 'calc(100% - 230px)' }}>
            <header className="top-navbar">
              <div className="search-bar">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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

            <main className="content-area">
              <Flashcards />
            </main>
          </div>
        </>
      )}

      {/* ===== PLACEHOLDER PAGES ===== */}
      {activeNav === 'quizzes' && (
        <div style={{ padding: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Quizzes</h2>
          <p style={{ color: '#6B7280' }}>Coming soon.</p>
        </div>
      )}

      {activeNav === 'focus' && (
        <div style={{ padding: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Focus Zone</h2>
          <p style={{ color: '#6B7280' }}>Coming soon.</p>
        </div>
      )}
    </div>
  )
}

export default App
