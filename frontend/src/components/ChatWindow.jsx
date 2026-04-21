import { useState, useRef, useEffect } from 'react'
import Message from './Message'
import LoadingDots from './LoadingDots'

const API_BASE = 'http://localhost:8000'

export default function ChatWindow({ sessionId, onSessionCreated }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // Load history from backend when session changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }
    fetch(`${API_BASE}/app/${sessionId}/history`)
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(m => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content,
        }))
        setMessages(mapped)
      })
      .catch(() => setMessages([]))
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const activeSessionId = sessionId || crypto.randomUUID()
    const isNewSession = !sessionId

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/app/${activeSessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          { role: 'error', content: data.detail ?? 'Something went wrong. Please try again.' },
        ])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        if (isNewSession) onSessionCreated(activeSessionId)
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'error', content: 'Could not reach the server. Please try again.' },
      ])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInput(e) {
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {sessionId ? `Session: ${sessionId.slice(0, 8)}…` : 'New chat'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">Ask me anything — I'm here to help you learn!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm">
              <LoadingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-3 border border-gray-800 focus-within:border-indigo-500 transition-colors">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none max-h-32 leading-relaxed"
            placeholder="Ask a question..."
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
