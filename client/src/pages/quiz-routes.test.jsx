import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppRoutes from '../AppRoutes'
import api from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Quiz routes', () => {
  beforeEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('renders quiz list route', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        items: [],
        page: 1,
        page_size: 10,
        total: 0,
        total_pages: 1,
      },
    })

    render(
      <MemoryRouter initialEntries={['/quizzes']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByText('My Quizzes')).toBeInTheDocument()
  })

  it('opens requested root tab when navigating away from quizzes sidebar', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        items: [],
        page: 1,
        page_size: 10,
        total: 0,
        total_pages: 1,
      },
    })

    render(
      <MemoryRouter initialEntries={['/quizzes']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Transcription' }))

    expect(await screen.findByRole('heading', { name: 'Transcription' })).toBeInTheDocument()
  })

  it('renders quiz edit route', async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          id: 1,
          title: 'Biology Test',
          subject: 'Biology',
          description: 'desc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [],
          page: 1,
          total: 0,
        },
      })

    render(
      <MemoryRouter initialEntries={['/quizzes/1/edit']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByText('General Information')).toBeInTheDocument()
  })

  it('renders quiz take route', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        id: 4,
        quiz_id: 1,
        current_question_index: 0,
        questions: [
          {
            id: 9,
            quiz_id: 1,
            type: 'open',
            question_text: 'Explain memory',
            options: null,
          },
        ],
        answers: [],
      },
    })

    render(
      <MemoryRouter initialEntries={['/quizzes/1/take']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Explain memory')).toBeInTheDocument()
  })

  it('renders quiz results route', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        attempt_id: 5,
        quiz_id: 1,
        status: 'completed',
        total_score: 1,
        percentage: 100,
        questions: [
          {
            question_id: 1,
            type: 'open',
            question_text: 'Describe osmosis',
            options: null,
            correct_option: null,
            explanation: { text: 'Diffusion explanation' },
            user_answer: 'answer',
            score: 1,
            ai_feedback: 'great',
            is_correct: null,
          },
        ],
      },
    })

    render(
      <MemoryRouter initialEntries={['/quizzes/1/results?attempt=5']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Question Review')).toBeInTheDocument()
    })
  })
})
