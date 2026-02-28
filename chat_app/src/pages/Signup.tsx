import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', { 
        firstName, lastName, email, password 
      });
      const { user, token } = response.data;
      
      // Save to global state
      setAuth(user, token);
      
      console.log('Signup successful:', response.data);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || 
          err.message || 
          'An error occurred during registration'
        );
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-screen p-6">
      <div className="w-full max-w-[440px] bg-slate-800/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl -rotate-10 shadow-[0_0_20px_rgba(168,85,247,0.4)] relative after:content-[''] after:absolute after:inset-1 after:rounded-lg after:bg-slate-800 after:opacity-30"></div>
          </div>
          <h2 className="text-3xl font-semibold mb-2 tracking-tight text-slate-50">Create an account</h2>
          <p className="text-slate-400 text-sm">Sign up to get started with our platform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-5 text-center">{error}</div>}
          
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="flex flex-col gap-1.5 mb-4 flex-1">
              <label className="text-sm font-medium text-slate-400" htmlFor="firstName">First name</label>
              <div className="relative flex items-center group">
                <User className="absolute left-4 text-slate-500 transition-colors pointer-events-none group-focus-within:text-indigo-500" size={20} />
                <input
                  id="firstName"
                  type="text"
                  className="w-full py-3 px-4 pl-11 rounded-xl border border-white/10 bg-slate-900/60 text-slate-50 text-base transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:bg-slate-800 placeholder:text-slate-500"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-4 flex-1">
              <label className="text-sm font-medium text-slate-400" htmlFor="lastName">Last name</label>
              <div className="relative flex items-center group">
                <User className="absolute left-4 text-slate-500 transition-colors pointer-events-none group-focus-within:text-indigo-500" size={20} />
                <input
                  id="lastName"
                  type="text"
                  className="w-full py-3 px-4 pl-11 rounded-xl border border-white/10 bg-slate-900/60 text-slate-50 text-base transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:bg-slate-800 placeholder:text-slate-500"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm font-medium text-slate-400" htmlFor="email">Email address</label>
            <div className="relative flex items-center group">
              <Mail className="absolute left-4 text-slate-500 transition-colors pointer-events-none group-focus-within:text-indigo-500" size={20} />
              <input
                id="email"
                type="email"
                className="w-full py-3 px-4 pl-11 rounded-xl border border-white/10 bg-slate-900/60 text-slate-50 text-base transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:bg-slate-800 placeholder:text-slate-500"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm font-medium text-slate-400" htmlFor="password">Password</label>
            <div className="relative flex items-center group">
              <Lock className="absolute left-4 text-slate-500 transition-colors pointer-events-none group-focus-within:text-indigo-500" size={20} />
              <input
                id="password"
                type="password"
                className="w-full py-3 px-4 pl-11 rounded-xl border border-white/10 bg-slate-900/60 text-slate-50 text-base transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:bg-slate-800 placeholder:text-slate-500"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters long</p>
          </div>

          <button 
            type="submit" 
            className="mt-4 flex items-center justify-center gap-2 h-12 w-full py-3 px-6 rounded-xl border-none bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-base font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:brightness-110 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:grayscale-[0.5] group" 
            disabled={isLoading || !email || !password || !firstName || !lastName}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Create account
                <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1 group-disabled:translate-x-0" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400 pt-6 border-t border-white/10">
          <p>Already have an account? <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-400 transition-colors">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
