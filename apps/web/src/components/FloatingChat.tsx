import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { clsx } from 'clsx'

interface Message { role: 'user' | 'assistant'; content: string }

export default function FloatingChat() {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Don't show if not logged in
  if (!user) return null

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: t('chat.welcome')
      }])
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/ai/chat', { message: msg, history })
      const reply: Message = { role: 'assistant', content: res.data.reply }
      setMessages(prev => [...prev, reply])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.'
      }])
    }
    setLoading(false)
  }

  const suggestions = ['Find jobs in my field', 'Improve my profile', 'Interview tips']

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && !minimized && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-brand-green px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">NexaWork AI</p>
                <p className="text-green-200 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white">
                <Minus size={14} />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  msg.role === 'assistant' ? 'bg-brand-green' : 'bg-gray-200'
                )}>
                  {msg.role === 'assistant'
                    ? <Bot size={12} className="text-white" />
                    : <User size={12} className="text-gray-600" />}
                </div>
                <div className={clsx(
                  'max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-gray-50 text-gray-800 rounded-tl-none'
                    : 'bg-brand-green text-white rounded-tr-none'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-nowrap">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="flex-shrink-0 text-xs border border-brand-green/30 text-brand-green rounded-full px-2.5 py-1 hover:bg-brand-green-light transition-colors whitespace-nowrap">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2 bg-gray-50 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand-green/30">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask me anything..."
                className="flex-1 text-sm bg-transparent outline-none" />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="text-brand-green disabled:opacity-30 transition-opacity">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized bar */}
      {open && minimized && (
        <button onClick={() => setMinimized(false)}
          className="bg-brand-green text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:bg-brand-green-dark transition-colors">
          <Sparkles size={14} />
          <span className="text-sm font-medium">NexaWork AI</span>
        </button>
      )}

      {/* FAB button */}
      <button onClick={() => { setOpen(!open); setMinimized(false) }}
        className={clsx(
          'w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative',
          open ? 'bg-gray-700 hover:bg-gray-800' : 'bg-brand-green hover:bg-brand-green-dark'
        )}>
        {open
          ? <X size={22} className="text-white" />
          : <MessageSquare size={22} className="text-white" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold rounded-full text-xs text-white font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}
