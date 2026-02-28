import { useAuthStore } from '../store/useAuthStore';
import { LogOut, MessageSquare, Users, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen w-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[80px] md:w-[280px] bg-slate-800/80 backdrop-blur-md border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out">
        <div className="px-0 py-6 md:p-6 flex items-center justify-center md:justify-start gap-3 border-b border-white/5">
          <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg -rotate-10 shadow-[0_0_12px_rgba(168,85,247,0.4)]"></div>
          <h3 className="text-xl font-bold tracking-tight m-0 hidden md:block">ChatApp</h3>
        </div>
        
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <a href="#" className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl font-medium transition-all duration-200 bg-indigo-500/40 text-indigo-400 border-l-[3px] border-indigo-500">
            <MessageSquare size={20} />
            <span className="hidden md:inline">Messages</span>
          </a>
          <a href="#" className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-slate-400 font-medium transition-all duration-200 hover:bg-white/5 hover:text-slate-50">
            <Users size={20} />
            <span className="hidden md:inline">Contacts</span>
          </a>
          <a href="#" className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-slate-400 font-medium transition-all duration-200 hover:bg-white/5 hover:text-slate-50">
            <Settings size={20} />
            <span className="hidden md:inline">Settings</span>
          </a>
        </nav>

        <div className="p-5 md:px-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 bg-slate-900/30">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center font-semibold text-lg text-white shadow-md flex-shrink-0">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold text-slate-50 max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-emerald-500 flex items-center gap-1 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-500">Online</span>
            </div>
          </div>
          <button onClick={logout} className="bg-transparent border-none text-slate-500 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:text-red-500 hover:bg-red-500/10 shadow-none hover:shadow-none hover:translate-y-0" aria-label="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(30,41,59,0.5),transparent_50%)]">
        <header className="pt-8 px-10 pb-6">
          <h2 className="text-3xl mb-2 text-slate-50">Welcome back, {user?.firstName}! 👋</h2>
          <p className="text-slate-400">You have 3 new messages today.</p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-500">
          <div className="w-24 h-24 rounded-full bg-white/[0.03] flex items-center justify-center mb-6 text-slate-400 border border-dashed border-white/10">
            <MessageSquare size={48} />
          </div>
          <h3 className="text-xl text-slate-50 mb-2 font-semibold">Your messages will appear here</h3>
          <p>Select a contact from the sidebar to start chatting.</p>
        </div>
      </main>
    </div>
  );
}
