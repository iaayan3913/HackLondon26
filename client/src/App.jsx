import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'
import Flashcards from './Flashcards'   // ← this was missing

function App() {
  const [page, setPage] = useState('home')
  const [apiMessage, setApiMessage] = useState('Loading...')

  useEffect(() => {
    axios.get('http://localhost:8000/api/test')
      .then(res => setApiMessage(res.data.message))
      .catch(() => setApiMessage('Failed to connect'))
  }, [])

  return (
    <>
      {/* Simple nav to switch pages */}
      <nav style={{ display: 'flex', gap: 12, padding: 16 }}>
        <button onClick={() => setPage('home')}>Home</button>
        <button onClick={() => setPage('flashcards')}>Flashcards</button>
      </nav>

      {/* Render the right page */}
      {page === 'home' && (
        <div>
          <h1>Home</h1>
          <p>{apiMessage}</p>
        </div>
      )}

      {page === 'flashcards' && <Flashcards />}
    </>
  )
}

export default App