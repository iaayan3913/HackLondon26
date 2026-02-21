import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

function App() {
  const [count, setCount] = useState(0)
  const [apiMessage, setApiMessage] = useState('Loading backend data...')

  useEffect(() => {
    // Fetch data from FastAPI backend
    axios.get('http://localhost:8000/api/test')
      .then(response => {
        setApiMessage(response.data.message)
      })
      .catch(error => {
        console.error('Error fetching data:', error)
        setApiMessage('Failed to connect to backend')
      })
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + FastAPI</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <div style={{ marginTop: '20px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', color: '#333' }}>
          <h3>Backend Connection Status</h3>
          <p>Message: <strong>{apiMessage}</strong></p>
        </div>
      </div>
      <p className="read-the-docs">
        Edit <code>src/App.jsx</code> and save to test HMR
      </p>
    </>
  )
}

export default App
