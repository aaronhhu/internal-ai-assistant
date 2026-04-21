export default function Message({ role, content }) {
  const isUser = role === 'user'
  const isError = role === 'error'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : isError
            ? 'bg-red-900/50 text-red-300 border border-red-800 rounded-bl-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        {isError && <span className="font-medium">⚠ </span>}
        {content}
      </div>
    </div>
  )
}
