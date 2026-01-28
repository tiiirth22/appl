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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
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
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} />} />
          <Route path="/dashboard" element={renderDashboardRedirect()} />

          {/* Explicit Dashboard Routes */}
          <Route path="/admin" element={
            user?.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/dashboard" />
          } />
          <Route path="/business" element={
            user?.role === 'business_owner' ? <BusinessOwnerDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/dashboard" />
          } />

          <Route path="/upload" element={user ? <ManualUpload user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={user ? <Analytics user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/chat" element={<ChatBot />} />
          <Route path="/device/:qrId" element={<ChatBot />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;