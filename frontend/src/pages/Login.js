import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Loader2, ArrowRight, Shield, Zap, Activity, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL as API } from '../config';

export default function Login(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      const { user: userData, session_token } = response.data;
      
      if (props.onLogin) {
        props.onLogin(userData, session_token);
      }
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0].msg : 'Invalid credentials');
      alert('Login failed: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div className="bg-aura" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="elite-panel"
        style={{ width: '100%', maxWidth: '480px', padding: '64px', borderRadius: '32px', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', boxShadow: '0 40px 120px rgba(0,0,0,0.5)' }}
      >
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            width: '48px', height: '48px', background: 'var(--color-text-primary)', borderRadius: '14px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg-base)',
            margin: '0 auto 24px'
          }}>
            <Cpu size={24} />
          </div>
          <h1 className="heading-elite" style={{ fontSize: '2rem', marginBottom: '8px' }}>Identity Vault.</h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', fontWeight: 500 }}>Authorized personnel only.</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
            <input 
              type="email" 
              placeholder="System Email" 
              className="input-elite" 
              style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
            <input 
              type="password" 
              placeholder="Access Key" 
              className="input-elite" 
              style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-elite" 
            style={{ width: '100%', padding: '18px', borderRadius: '14px', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" size={20} /> : <>Initialize Session <ArrowRight size={18} /></>}
          </motion.button>
        </form>

        <footer style={{ marginTop: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
            New operator? <Link to="/signup" style={{ color: 'var(--color-text-primary)', fontWeight: 700, textDecoration: 'none' }}>Initialize Account</Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}