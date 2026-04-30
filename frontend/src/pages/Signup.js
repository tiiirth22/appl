import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Loader2, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL as API } from '../config';

export default function Signup(props) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'business_owner' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signup`, formData, { withCredentials: true });
      const { user: userData, session_token } = response.data;
      if (props.onLogin) props.onLogin(userData, session_token);
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Signup failed');
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
        style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}
      >
        <div style={{ 
          width: '64px', height: '64px', background: 'var(--color-text-primary)', borderRadius: '18px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg-base)',
          margin: '0 auto 40px', boxShadow: '0 0 40px rgba(255,255,255,0.1)'
        }}>
          <Cpu size={32} />
        </div>

        <h1 className="heading-elite" style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '16px' }}>New_Operator.</h1>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', fontWeight: 500, marginBottom: '48px' }}>Register identity on the diagnostic grid.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" placeholder="FULL_NAME" className="input-elite" 
            style={{ width: '100%', padding: '20px 24px', borderRadius: '16px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required
          />
          <input 
            type="email" placeholder="OPERATOR_EMAIL" className="input-elite" 
            style={{ width: '100%', padding: '20px 24px', borderRadius: '16px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}
            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required
          />
          <input 
            type="password" placeholder="ACCESS_KEY" className="input-elite" 
            style={{ width: '100%', padding: '20px 24px', borderRadius: '16px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}
            value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required
          />

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '14px', border: 'var(--border-thin)', display: 'flex', gap: '4px', marginTop: '12px' }}>
            {['business_owner', 'admin'].map(r => (
              <button key={r} type="button" onClick={() => setFormData({...formData, role: r})}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900, 
                  background: formData.role === r ? 'var(--color-text-primary)' : 'transparent',
                  color: formData.role === r ? 'var(--color-bg-base)' : 'var(--color-text-dim)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" className="btn-elite" style={{ width: '100%', padding: '20px', borderRadius: '16px', marginTop: '16px' }} disabled={loading}
          >
            {loading ? <Loader2 className="spinner" size={20} /> : 'INITIALIZE_ACCOUNT'}
          </motion.button>
        </form>

        <footer style={{ marginTop: '64px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            ALREADY REGISTERED? <Link to="/login" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--color-text-primary)' }}>ACCESS_PORTAL</Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}