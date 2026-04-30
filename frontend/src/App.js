import { useEffect, useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

// ── Page Transition Wrapper ──
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    style={{ position: 'relative', zIndex: 1 }}
  >
    {children}
  </motion.div>
);

// ── Global Particle Layer ──
const SystemAura = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.03, 0.07, 0.03],
        rotate: [0, 90, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{ 
        position: 'absolute', top: '-20%', right: '-10%', width: '70%', height: '70%', 
        background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
        borderRadius: '50%'
      }} 
    />
    <motion.div 
      animate={{ 
        scale: [1.2, 1, 1.2],
        opacity: [0.02, 0.05, 0.02],
        rotate: [0, -90, 0]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      style={{ 
        position: 'absolute', bottom: '-10%', left: '-10%', width: '60%', height: '60%', 
        background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
        borderRadius: '50%'
      }} 
    />
  </div>
);

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
    return user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/business" />;
  };

  if (loading) {
    return (
      <div className="premium-loading" style={{ background: 'var(--color-bg-base)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: '40px', height: '40px', background: 'var(--color-accent)', borderRadius: '4px' }}
        />
        <p style={{ marginTop: '24px', color: 'var(--color-text-dim)', letterSpacing: '0.2em', fontSize: '0.7rem', fontWeight: 800 }}>SYSTEM_SYNCING</p>
      </div>
    );
  }

  return (
    <div className="App" style={{ background: 'var(--color-bg-base)', minHeight: '100vh', position: 'relative' }}>
      <SystemAura />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PageTransition>{user ? <Navigate to="/dashboard" /> : <Landing currentTheme={theme} toggleTheme={toggleTheme} />}</PageTransition>} />
          <Route path="/login" element={<PageTransition>{user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} currentTheme={theme} toggleTheme={toggleTheme} />}</PageTransition>} />
          <Route path="/signup" element={<PageTransition>{user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} currentTheme={theme} toggleTheme={toggleTheme} />}</PageTransition>} />
          <Route path="/dashboard" element={<PageTransition>{renderDashboardRedirect()}</PageTransition>} />

          <Route path="/admin" element={<PageTransition>
            {user?.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" />}
          </PageTransition>} />
          
          <Route path="/business" element={<PageTransition>
            {user?.role === 'business_owner' ? <BusinessOwnerDashboard user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" />}
          </PageTransition>} />

          <Route path="/upload" element={<PageTransition>{user ? <ManualUpload user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />}</PageTransition>} />
          <Route path="/analytics" element={<PageTransition>{user ? <Analytics user={user} onLogout={handleLogout} currentTheme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />}</PageTransition>} />
          <Route path="/chat" element={<PageTransition><ChatBot currentTheme={theme} toggleTheme={toggleTheme} /></PageTransition>} />
          <Route path="/device/:qrId" element={<PageTransition><ChatBot currentTheme={theme} toggleTheme={toggleTheme} /></PageTransition>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;