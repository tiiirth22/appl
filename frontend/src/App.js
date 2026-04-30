import { useEffect, useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import BusinessOwnerDashboard from './pages/BusinessOwnerDashboard';
import ManualUpload from './pages/ManualUpload';
import Analytics from './pages/Analytics';
import ChatBot from './pages/ChatBot';

import { API_BASE_URL as API } from './config';
const SESSION_TOKEN_KEY = 'session_token';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    checkAuth();
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderDashboardRedirect = () => {
    if (!user) return <Navigate to="/login" />;

    if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    } else {
      return <Navigate to="/business" />;
    }
  };

  if (loading) {
    return (
      <div className="premium-loading">
        <div className="pulse-logo"></div>
        <p style={{ marginTop: '24px', color: 'var(--color-text-dim)', letterSpacing: '0.1em', fontSize: '0.8rem', fontWeight: 600 }}>INITIALIZING APPLIANCEIQ</p>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="bg-aura"></div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing currentTheme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} currentTheme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} currentTheme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/dashboard" element={renderDashboardRedirect()} />

          {/* Explicit Dashboard Routes */}
          <Route path="/admin" element={
            user?.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" />
          } />
          <Route path="/business" element={
            user?.role === 'business_owner' ? <BusinessOwnerDashboard user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" />
          } />

          <Route path="/upload" element={user ? <ManualUpload user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={user ? <Analytics user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
          <Route path="/chat" element={<ChatBot currentTheme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/device/:qrId" element={<ChatBot currentTheme={theme} toggleTheme={toggleTheme} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;