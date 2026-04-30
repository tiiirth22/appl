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
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}
      >
        <div style={{ 
          width: '64px', height: '64px', background: 'var(--color-text-primary)', borderRadius: '18px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg-base)',
          margin: '0 auto 40px', boxShadow: '0 0 40px rgba(255,255,255,0.1)'
        }}>
          <Cpu size={32} />
        </div>

        <h1 className="heading-elite" style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '16px' }}>Terminal_Access.</h1>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', fontWeight: 500, marginBottom: '64px' }}>Initialize secure link to the diagnostic network.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="OPERATOR_EMAIL" 
            className="input-elite" 
            style={{ width: '100%', padding: '20px 24px', borderRadius: '16px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="ACCESS_KEY" 
            className="input-elite" 
            style={{ width: '100%', padding: '20px 24px', borderRadius: '16px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-elite" 
            style={{ width: '100%', padding: '20px', borderRadius: '16px', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" size={20} /> : 'SYNCHRONIZE'}
          </motion.button>
        </form>

        <footer style={{ marginTop: '64px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            NO ACCOUNT? <Link to="/signup" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--color-text-primary)' }}>REGISTER_NEW_OPERATOR</Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}