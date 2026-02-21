import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import useSpeechRecognition from './useSpeechRecognition'

describe('useSpeechRecognition', () => {
  const originalSpeech = window.SpeechRecognition
  const originalWebkit = window.webkitSpeechRecognition

  afterEach(() => {
    window.SpeechRecognition = originalSpeech
    window.webkitSpeechRecognition = originalWebkit
  })

  it('reports unsupported when API is unavailable', () => {
    window.SpeechRecognition = undefined
    window.webkitSpeechRecognition = undefined

    const { result } = renderHook(() => useSpeechRecognition({ onTranscript: () => {} }))

    expect(result.current.supported).toBe(false)
  })

  it('starts listening when speech API exists', () => {
    const start = vi.fn()
    const stop = vi.fn()

    class MockSpeech {
      start = start
      stop = stop
    }

    window.SpeechRecognition = MockSpeech
    window.webkitSpeechRecognition = undefined

    const { result } = renderHook(() => useSpeechRecognition({ onTranscript: () => {} }))

    expect(result.current.supported).toBe(true)
    result.current.start()
    expect(start).toHaveBeenCalledTimes(1)
  })
})
