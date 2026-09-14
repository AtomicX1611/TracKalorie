import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Trash2, Sparkles, ChevronDown } from 'lucide-react'
import { chatApi } from '../api/chat'
import { cn } from '../lib/utils'

// ── Lightweight markdown renderer ─────────────────────────────────────────────
// Handles: **bold**, *italic*, `code`, bullet lists, line breaks
function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let keyIdx = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Bullet list items
    if (/^[-*•]\s/.test(line)) {
      elements.push(
        <li key={keyIdx++} className="ml-4 text-sm leading-relaxed">
          {parseInline(line.replace(/^[-*•]\s/, ''))}
        </li>
      )
      continue
    }

    // Empty line → spacer
    if (line.trim() === '') {
      if (elements.length > 0) elements.push(<div key={keyIdx++} className="h-1" />)
      continue
    }

    elements.push(
      <p key={keyIdx++} className="text-sm leading-relaxed">
        {parseInline(line)}
      </p>
    )
  }

  return elements
}

function parseInline(text) {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={i} className="font-mono text-xs bg-surface-elevated px-1 py-0.5 rounded text-accent">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// ── Action badge ──────────────────────────────────────────────────────────────
function ActionBadge({ action }) {
  const labels = {
    log_meal:    { icon: '🍽', label: 'Meal logged', color: 'text-accent' },
    set_goal:    { icon: '🎯', label: 'Goal updated', color: 'text-blue-400' },
    delete_meal: { icon: '🗑', label: 'Meal deleted', color: 'text-destructive' },
  }
  const def = labels[action.tool]
  if (!def) return null
  const cal = action.result?.totals?.calories ?? action.result?.goal?.dailyCalorieTarget
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1',
      'bg-surface-elevated border-border',
      def.color
    )}>
      <span>{def.icon}</span>
      <span>{def.label}</span>
      {cal != null && <span className="text-muted-foreground">· {Math.round(cal)} kcal</span>}
    </span>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
        <Sparkles className="w-3 h-3 text-accent" />
      </div>
      <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
              style={{
                animation: 'chatBounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex items-end gap-2 mb-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-accent/30' : 'bg-accent/20'
      )}>
        {isUser
          ? <span className="text-xs font-bold text-accent">U</span>
          : <Sparkles className="w-3 h-3 text-accent" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] flex flex-col gap-1',
        isUser ? 'items-end' : 'items-start'
      )}>
        <div className={cn(
          'px-4 py-2.5 rounded-2xl text-sm',
          isUser
            ? 'bg-accent/15 border border-accent/20 rounded-br-sm text-foreground'
            : 'bg-surface-elevated border border-border rounded-bl-sm text-foreground'
        )}>
          {isUser
            ? <p className="text-sm leading-relaxed">{message.content}</p>
            : <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
          }
        </div>

        {/* Action badges */}
        {message.actions?.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.actions.map((action, i) => (
              <ActionBadge key={i} action={action} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground/50 px-1">
          {message.timestamp}
        </span>
      </div>
    </div>
  )
}

// ── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen() {
  const suggestions = [
    'What did I eat today?',
    'Log 2 boiled eggs for breakfast',
    'How much protein is in 100g salmon?',
    'Show my weekly summary',
    'Set my calorie goal to 2000',
  ]
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pb-4 gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Meet Kalorie AI</h3>
        <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
          Your nutrition assistant. Log meals, check goals, and ask anything — in plain English.
        </p>
      </div>
      <div className="w-full space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium text-center mb-2">Try asking…</p>
        {suggestions.map((s, i) => (
          <button
            key={i}
            id={`chat-suggestion-${i}`}
            className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-elevated border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all"
            onClick={() => {
              // Dispatch a custom event that ChatDrawer listens to
              window.dispatchEvent(new CustomEvent('chat:suggestion', { detail: s }))
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Conversation persistence ──────────────────────────────────────────────────
// Store keyed to 'trackalorie_chat' so it doesn't clash with other app state.
// We trim to the last 50 messages to prevent localStorage growing unbounded.
const STORAGE_KEY = 'trackalorie_chat_v1'
const MAX_STORED_MESSAGES = 50

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveMessages(msgs) {
  try {
    const toStore = msgs.slice(-MAX_STORED_MESSAGES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // localStorage might be unavailable (private browsing with storage blocked)
  }
}

function clearMessages() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

// ── Main ChatDrawer ───────────────────────────────────────────────────────────
export default function ChatDrawer() {
  const [open, setOpen] = useState(false)
  // Restore persisted conversation on first mount
  const [messages, setMessages] = useState(() => loadMessages())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (open) {
      scrollToBottom()
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, messages.length, scrollToBottom])

  // Listen for suggestion clicks from the WelcomeScreen
  useEffect(() => {
    const handler = (e) => {
      setInput(e.detail)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    window.addEventListener('chat:suggestion', handler)
    return () => window.removeEventListener('chat:suggestion', handler)
  }, [])

  const getTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Persist to localStorage whenever messages change
  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const sendMessage = async (text = input) => {
    const userText = text.trim()
    if (!userText || loading) return

    const userMsg = { role: 'user', content: userText, timestamp: getTimestamp() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    // Build history in OpenAI format (role + content only)
    const history = nextMessages.map(({ role, content }) => ({ role, content }))

    try {
      const { reply, actionsPerformed } = await chatApi.send(history)
      const assistantMsg = {
        role: 'assistant',
        content: reply,
        actions: actionsPerformed ?? [],
        timestamp: getTimestamp(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (!open) setHasUnread(true)

      // ── Live page refresh ──────────────────────────────────────────────────
      // If the AI performed any write actions, notify all mounted pages so
      // they can silently re-fetch their data — no page reload needed.
      if (actionsPerformed?.length > 0) {
        const actionTypes = actionsPerformed.map((a) => a.tool)
        window.dispatchEvent(
          new CustomEvent('trackalorie:data-changed', { detail: { actions: actionTypes } })
        )
      }
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.',
        actions: [],
        timestamp: getTimestamp(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearHistory = () => {
    setMessages([])
    clearMessages()
  }

  return (
    <>
      {/* ── Keyframe injection ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes chatSlideOut {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(100%); opacity: 0; }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 255, 178, 0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(124, 255, 178, 0); }
        }
        .chat-drawer-enter { animation: chatSlideIn 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
      `}</style>

      {/* ── Floating action button ──────────────────────────────────────────── */}
      <button
        id="chat-fab"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-6 right-6 z-40 w-13 h-13 rounded-2xl flex items-center justify-center',
          'bg-accent text-background shadow-lg shadow-accent/25',
          'hover:bg-accent-dim active:scale-95 transition-all duration-200',
          !open && 'hover:shadow-accent/40',
        )}
        style={{
          width: 52,
          height: 52,
          animation: hasUnread ? 'chatPulse 2s ease-in-out infinite' : 'none',
        }}
        title="Chat with Kalorie AI"
        aria-label="Open AI chat assistant"
      >
        {open
          ? <ChevronDown className="w-5 h-5" />
          : <MessageSquare className="w-5 h-5" />
        }
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
        )}
      </button>

      {/* ── Drawer panel ───────────────────────────────────────────────────── */}
      {open && (
        <div
          id="chat-drawer"
          className="chat-drawer-enter fixed bottom-20 right-6 z-40 w-[360px] flex flex-col rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/60"
          style={{ height: '520px', background: '#0F0F11' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">Kalorie AI</p>
                <p className="text-[10px] text-accent/70 leading-tight">Powered by GPT-4o</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  id="chat-clear-btn"
                  onClick={clearHistory}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                id="chat-close-btn"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
            {messages.length === 0 ? (
              <WelcomeScreen />
            ) : (
              <>
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-border bg-surface shrink-0">
            <div className="flex items-end gap-2 bg-surface-elevated border border-border rounded-xl px-3 py-2 focus-within:border-accent/50 transition-colors">
              <textarea
                ref={inputRef}
                id="chat-input"
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  // Auto-resize
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your nutrition…"
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed py-0 min-h-[20px] max-h-[100px]"
                style={{ height: 20 }}
              />
              <button
                id="chat-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                  input.trim() && !loading
                    ? 'bg-accent text-background hover:bg-accent-dim active:scale-90'
                    : 'bg-surface text-muted-foreground/30 cursor-not-allowed'
                )}
              >
                {loading
                  ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-3 h-3" />
                }
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  )
}
