import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AuthRoute from './components/AuthRoute';
import { useAuthStore } from './store/useAuthStore';
import api from './api/axios';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { isAuthenticated, accessToken, setAccessToken, logout } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // If we think we are authenticated but have no access token in memory (e.g. page refresh)
      if (isAuthenticated && !accessToken) {
        try {
          const response = await api.post('/auth/refresh');
          setAccessToken(response.data.accessToken);
        } catch (error) {
          console.error('Silent refresh failed:', error);
          logout(); // Refresh token expired or missing
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, [isAuthenticated, accessToken, setAccessToken, logout]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route element={<AuthRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
