import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      const res = await fetch(`${API_BASE}/sessions`)
      const data = await res.json()
      setSessions(data)
    } catch {
      // server not reachable yet
    }
  }

  function handleNewChat() {
    setCurrentSessionId(null)
  }

  function handleSelectSession(sessionId) {
    setCurrentSessionId(sessionId)
  }

  function handleSessionCreated(sessionId) {
    setCurrentSessionId(sessionId)
    fetchSessions()
  }

  async function handleDeleteSession(sessionId) {
    await fetch(`${API_BASE}/app/${sessionId}`, { method: 'DELETE' })
    if (currentSessionId === sessionId) setCurrentSessionId(null)
    fetchSessions()
  }

  return (
    <div className="flex h-full bg-gray-950 text-white">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      <ChatWindow
        sessionId={currentSessionId}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  )
}
