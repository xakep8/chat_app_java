import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LogOut, 
  MessageSquare, 
  Users, 
  Settings, 
  Search, 
  MoreVertical, 
  Phone, 
  Video,
  Send,
  Plus,
  Circle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import api from '../api/axios';
import { useChat } from '../hooks/useChat';
import UserSearchModal from '../components/UserSearchModal';

interface Chat {
  id: number;
  otherParticipantName: string;
  lastMessage: string;
  lastMessageTime: string;
  initials: string;
  gradient: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const TickIcon = ({ status }: { status: 'SENT' | 'DELIVERED' | 'READ' }) => {
  const isRead = status === 'READ';
  const color = isRead ? "#38bdf8" : "#94a3b8"; // sky-400 for read, slate-400 for others

  if (status === 'SENT') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    );
  }

  // Double Check for DELIVERED or READ
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 6 7 17 2 12"></polyline>
      <polyline points="22 10 15 17 11 13"></polyline>
    </svg>
  );
};

export default function Messages() {
  const { user, logout } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'messages' | 'contacts'>('messages');
  const [messageText, setMessageText] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, sendMessage, isConnected, markMessageAsRead } = useChat(selectedChatId);

  console.log('[Messages] Render state:', { selectedChatId, isConnected, messageCount: messages.length });

  const selectedChat = Array.isArray(chats) ? chats.find(c => c.id === selectedChatId) : undefined;

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId]);

  // Auto-read incoming messages when chat is active
  useEffect(() => {
    if (!messages || messages.length === 0 || !user || !selectedChatId) return;

    messages.forEach((msg) => {
      if (msg.senderId !== user.id && msg.status !== 'READ') {
        markMessageAsRead(msg.id);
      }
    });
  }, [messages, user, selectedChatId, markMessageAsRead]);

  // View transition effect
  useEffect(() => {
    if (currentView === 'contacts' && contacts.length === 0) {
      fetchContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      setIsLoadingChats(true);
      const response = await api.get('/chats');
      const data = Array.isArray(response.data) ? response.data : [];
      setChats(data);
      if (data.length > 0 && !selectedChatId) {
        setSelectedChatId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setChats([]); // Reset to empty array on error
    } finally {
      setIsLoadingChats(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true);
      // Fetching with empty query gets all users in our current backend implementation
      const response = await api.get('/users/search?query=');
      const data = Array.isArray(response.data) ? response.data : [];
      // Filter out the current user from contacts
      setContacts(data.filter((u: User) => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      console.log(`[Messages] Fetching messages for chatId: ${chatId}`);
      setIsLoadingMessages(true);
      setMessages([]); // Clear immediately when starting fetch
      const response = await api.get(`/messages/${chatId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      console.log(`[Messages] Fetched ${data.length} messages`);
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]); // Reset to empty array on error
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed on backend:', error);
    } finally {
      logout();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (messageText.trim() === "" || !isConnected) {
      console.log('Cannot send message: text empty or disconnected', { text: messageText, isConnected });
      return;
    }

    console.log('Sending message via STOMP:', { chatId: selectedChatId, text: messageText });
    sendMessage(messageText);
    setMessageText("");
  };

  const handleCreateChat = async (receiverId: number) => {
    try {
      const response = await api.post(`/chats/${receiverId}`);
      const newChat = response.data;
      
      // Update chat list if it doesn't already contain this chat
      if (!chats.find(c => c.id === newChat.id)) {
        setChats(prev => [newChat, ...prev]);
      }
      
      setSelectedChatId(newChat.id);
      setIsSearchModalOpen(false);
      setCurrentView('messages'); // Switch back to messages view when chat starts
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* 1. Global Navigation Vertical Sidebar (Bottom Nav on Mobile) */}
      <aside className={`md:relative md:w-[80px] md:h-auto md:flex-col fixed bottom-0 z-50 w-full h-16 flex-row justify-around md:justify-start items-center md:py-8 bg-slate-900/50 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/5 md:gap-8 transition-all duration-300 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform cursor-pointer">
          <div className="w-5 h-5 bg-white rounded-sm opacity-20"></div>
        </div>
        
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 flex-1 items-center justify-center md:justify-start">
          <button 
            onClick={() => setCurrentView('messages')}
            className={`p-3 rounded-xl group relative transition-all ${
              currentView === 'messages' 
              ? 'bg-indigo-500/10 text-indigo-400' 
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <MessageSquare size={24} />
            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Messages</span>
          </button>
          <button 
            onClick={() => setCurrentView('contacts')}
            className={`p-3 rounded-xl group relative transition-all ${
              currentView === 'contacts' 
              ? 'bg-indigo-500/10 text-indigo-400' 
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Users size={24} />
            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Contacts</span>
          </button>
          <button className="p-3 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all group relative">
            <Settings size={24} />
            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Settings</span>
          </button>
        </nav>

        <button onClick={handleLogout} className="p-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all group relative">
          <LogOut size={24} />
          <span className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-red-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Logout</span>
        </button>
      </aside>

      {/* 2. Dynamic Sidebar (Chats or Contacts) */}
      <section className={`w-full md:w-[380px] pb-16 md:pb-0 bg-slate-900/30 border-r border-white/5 flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-4 md:p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {currentView === 'messages' ? 'Messages' : 'Contacts'}
            </h1>
            {currentView === 'messages' && (
              <button 
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={currentView === 'messages' ? "Search conversations..." : "Search contacts..."}
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-500"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentView === 'messages' ? (
            // MESSAGES VIEW
            isLoadingChats ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : chats.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm italic">
                No conversations found.
              </div>
            ) : (
              chats.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                    selectedChatId === chat.id 
                    ? "bg-indigo-500/10 border-indigo-500" 
                    : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${chat.gradient} flex items-center justify-center font-bold text-white shadow-lg`}>
                      {chat.initials}
                    </div>
                    {/* Status could be dynamic in the future */}
                    <Circle className="absolute -bottom-1 -right-1 text-emerald-500 fill-emerald-500 bg-slate-900 rounded-full p-0.5" size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-100 truncate">{chat.otherParticipantName}</h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate leading-relaxed">{chat.lastMessage}</p>
                  </div>
                </div>
              ))
            )
          ) : (
            // CONTACTS VIEW
            isLoadingContacts ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm italic">
                No contacts available.
              </div>
            ) : (
              <div className="p-2">
                {contacts.map((contact) => (
                   <button
                     key={contact.id}
                     onClick={() => handleCreateChat(contact.id)}
                     className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                   >
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white shadow-lg uppercase flex-shrink-0">
                       {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold text-white truncate">{contact.firstName} {contact.lastName}</p>
                       <p className="text-[10px] text-slate-500 truncate mt-0.5">{contact.email}</p>
                     </div>
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <MessageSquare size={14} />
                     </div>
                   </button>
                ))}
              </div>
            )
          )}
        </div>

        <footer className="p-4 bg-slate-900/40 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
             </div>
          </div>
        </footer>
      </section>

      {/* 3. Main Chat Area */}
      <main className={`w-full md:flex-1 flex-col relative bg-[radial-gradient(circle_at_50%_0%,rgba(30,41,59,0.5),transparent_70%)] ${selectedChatId ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Header */}
        <header className="h-[70px] md:h-[80px] px-4 md:px-8 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-slate-900/20 z-10">
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => setSelectedChatId(null)} 
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 uppercase">
              {selectedChat.initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{selectedChat.otherParticipantName}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`} />
                <span className="text-xs text-slate-400 font-medium">
                  {isConnected ? "Connected" : "Disconnected - reconnecting..."}
                </span>
              </div>
            </div>
          </div>    <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  <Phone size={20} />
                </button>
                <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  <Video size={20} />
                </button>
                <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-sm italic">Select a conversation to start chatting</div>
          )}
        </header>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar scroll-smooth">
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : !selectedChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
               <MessageSquare size={64} className="mb-4 text-slate-600" />
               <h3 className="text-xl font-bold mb-1">Select a chat</h3>
               <p className="text-sm max-w-[240px]">Pick a conversation from the left to view messages.</p>
            </div>
          ) : !Array.isArray(messages) || messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
               <MessageSquare size={64} className="mb-4 text-slate-600" />
               <h3 className="text-xl font-bold mb-1">No messages yet</h3>
               <p className="text-sm max-w-[240px]">Start the conversation by typing your first message below.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-end gap-2 max-w-[80%] md:max-w-[70%] group">
                    {!isMe && (
                       <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedChat?.gradient} flex items-center justify-center text-[10px] font-bold text-white shadow-md flex-shrink-0 mb-1`}>
                         {selectedChat?.initials}
                       </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl relative ${
                      isMe 
                      ? "bg-indigo-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(79,70,229,0.3)]" 
                      : "bg-slate-800 text-slate-200 rounded-bl-none border border-white/5"
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <span className={`text-[9px] absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                        isMe ? "-left-10 text-slate-500" : "-right-10 text-slate-500"
                      }`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                  {isMe ? (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[9px] text-slate-600 mr-0.5">{formatTime(msg.createdAt)}</span>
                      <TickIcon status={msg.status as 'SENT' | 'DELIVERED' | 'READ'} />
                    </div>
                  ) : (
                    idx === messages.length - 1 && (
                      <span className="text-[9px] text-slate-600 mt-1 ml-1">{formatTime(msg.createdAt)}</span>
                    )
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <footer className="p-6 pt-0 bg-transparent">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 p-2 pl-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl focus-within:border-indigo-500/40 transition-all"
          >
            <button type="button" className="text-slate-500 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5">
              <Plus size={20} />
            </button>
            <input 
              type="text" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={isConnected ? "Type your message here..." : "Connecting..."} 
              disabled={!isConnected || !selectedChatId}
              className="flex-1 bg-transparent border-none py-3 outline-none text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={!messageText.trim() || !isConnected || !selectedChatId}
              className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:shadow-none"
            >
              <Send size={18} />
            </button>
          </form>
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}} />

      <UserSearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectUser={handleCreateChat}
      />
    </div>
  );
}
