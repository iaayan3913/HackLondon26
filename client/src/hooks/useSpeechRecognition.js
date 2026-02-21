import { useEffect, useMemo, useRef, useState } from 'react'

function getSpeechCtor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export default function useSpeechRecognition({ onTranscript }) {
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')

  const supported = useMemo(() => !!getSpeechCtor(), [])

  useEffect(() => {
    if (!supported) {
      return undefined
    }

    const SpeechCtor = getSpeechCtor()
    const recognition = new SpeechCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setError('')
      setIsListening(true)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      setError(event.error || 'Speech recognition failed')
      setIsListening(false)
    }

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      if (transcript.trim() && onTranscript) {
        onTranscript(transcript)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [supported, onTranscript])

  const start = () => {
    if (!recognitionRef.current) {
      return
    }
    setError('')
    recognitionRef.current.start()
  }

  const stop = () => {
    recognitionRef.current?.stop()
  }

  return {
    supported,
    isListening,
    error,
    start,
    stop,
  }
}
