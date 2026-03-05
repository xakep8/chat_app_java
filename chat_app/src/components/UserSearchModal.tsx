import { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, UserPlus } from 'lucide-react';
import api from '../api/axios';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: number) => void;
}

export default function UserSearchModal({ isOpen, onClose, onSelectUser }: UserSearchModalProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/users/search?query=${debouncedQuery}`);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Failed to search users:', error);
      setError(error.response?.status === 404 
        ? 'Search endpoint not found. Please re-compile and restart your backend.' 
        : 'Failed to search users. Please try again.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [debouncedQuery, searchUsers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <header className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">New Conversation</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-4 bg-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..." 
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-60">
              <Loader2 className="animate-spin text-indigo-500" size={24} />
              <p className="text-xs text-slate-400">Searching for users...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-60 text-center p-4">
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <p className="text-[10px] text-slate-500">Verify your backend is running the latest changes.</p>
            </div>
          ) : !Array.isArray(users) || users.length === 0 ? (
            <div className="flex-col items-center justify-center h-40 opacity-40 text-center flex">
              <Search size={40} className="mb-3" />
              <p className="text-sm">No users found</p>
              <p className="text-[10px]">Try searching for a different name or email</p>
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white shadow-lg uppercase">
                  {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <UserPlus size={16} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
