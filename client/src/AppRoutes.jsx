import { Navigate, Route, Routes } from 'react-router-dom'

import App from './App'
import QuizEditPage from './pages/QuizEditPage'
import QuizListPage from './pages/QuizListPage'
import QuizResultsPage from './pages/QuizResultsPage'
import QuizTakePage from './pages/QuizTakePage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/quizzes" element={<QuizListPage />} />
      <Route path="/quizzes/:id/edit" element={<QuizEditPage />} />
      <Route path="/quizzes/:id/take" element={<QuizTakePage />} />
      <Route path="/quizzes/:id/results" element={<QuizResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
