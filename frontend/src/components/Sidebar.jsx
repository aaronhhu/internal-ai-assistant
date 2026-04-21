import { useState } from 'react'

export default function Sidebar({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession }) {
  const [hoveredId, setHoveredId] = useState(null)

  return (
    <div className="w-64 shrink-0 flex flex-col bg-gray-900 border-r border-gray-800 h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium text-white cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-6 px-4">No previous chats</p>
        )}
        {sessions.map(session => (
          <div
            key={session.session_id}
            onMouseEnter={() => setHoveredId(session.session_id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`group flex items-center gap-1 px-2 py-1 mx-2 rounded-lg transition-colors ${
              session.session_id === currentSessionId
                ? 'bg-gray-800'
                : 'hover:bg-gray-800/50'
            }`}
          >
            <button
              onClick={() => onSelectSession(session.session_id)}
              className={`flex-1 text-left py-2 px-2 text-sm cursor-pointer truncate ${
                session.session_id === currentSessionId
                  ? 'text-white font-medium'
                  : 'text-gray-400 group-hover:text-gray-200'
              }`}
            >
              {session.preview}
            </button>

            {hoveredId === session.session_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSession(session.session_id)
                }}
                className="shrink-0 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-colors cursor-pointer"
                title="Delete chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600">AI Assistant</p>
      </div>
    </div>
  )
}
