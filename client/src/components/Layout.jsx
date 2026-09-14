import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatDrawer from './ChatDrawer'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {/* Floating AI chat — accessible from every protected page */}
      <ChatDrawer />
    </div>
  )
}
