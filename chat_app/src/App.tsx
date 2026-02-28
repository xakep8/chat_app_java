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
  const { isAuthenticated, accessToken, setAuth, logout } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // Try to silently refresh on load if we don't have an access token in memory.
      // This handles both page refreshes (where localStorage isAuthenticated is true) 
      // AND cases where localStorage was cleared but the HttpOnly cookie still exists.
      if (!accessToken) {
        try {
          const response = await api.post('/auth/refresh');
          // If successful, we have a valid cookie. Update token and auth state.
          // Now the backend returns the user object as well!
          const { user, token } = response.data;
          setAuth(user, token.accessToken);
        } catch (error) {
          console.log('Silent refresh failed. User needs to login.', error); // Intentionally not logging out if they weren't authenticated anyway
          if (isAuthenticated) {
              logout(); // Only logout (clear localStorage) if we thought they were authenticated
          }
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, [isAuthenticated, accessToken, setAuth, logout]);

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
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />
        
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
