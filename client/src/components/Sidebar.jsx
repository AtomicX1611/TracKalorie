import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  LayoutDashboard, UtensilsCrossed, Target, BarChart3,
  ScanLine, LogOut, Zap, MessageSquare
} from 'lucide-react'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meals',     icon: UtensilsCrossed, label: 'Meals' },
  { to: '/goals',     icon: Target,          label: 'Goals' },
  { to: '/reports',   icon: BarChart3,       label: 'Reports' },
  { to: '/ai',        icon: ScanLine,        label: 'AI Scanner' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col w-58 shrink-0 h-screen bg-surface border-r border-border sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <span className="font-semibold text-foreground tracking-tight">
          Trak<span className="text-accent">Kalorie</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* AI Chat button */}
        <button
          id="sidebar-chat-btn"
          onClick={() => document.getElementById('chat-fab')?.click()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-muted-foreground hover:text-foreground hover:bg-surface-elevated w-full text-left mt-1 border-t border-border pt-3"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          </div>
          <span>AI Chat</span>
          <span className="ml-auto text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">New</span>
        </button>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-elevated">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.email ?? 'demo@app.dev'}</p>
            <p className="text-xs text-muted-foreground">Free plan</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
