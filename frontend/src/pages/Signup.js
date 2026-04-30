import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Loader2, ArrowRight, QrCode, Database, Layers, CheckCircle2, Shield, User, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL as API } from '../config';

export default function Signup(props) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'business_owner' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signup`, formData, { withCredentials: true });
      const { user: userData, session_token } = response.data;
      
      if (props.onLogin) {
        props.onLogin(userData, session_token);
      }
      
      alert('Account initialized.');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Signup error:', error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0].msg : 'Check your details');
      alert('Signup failed: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div className="bg-aura" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="elite-panel"
        style={{ width: '100%', maxWidth: '560px', padding: '64px', borderRadius: '32px', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', boxShadow: '0 40px 120px rgba(0,0,0,0.5)' }}
      >
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            width: '48px', height: '48px', background: 'var(--color-text-primary)', borderRadius: '14px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg-base)',
            margin: '0 auto 24px'
          }}>
            <Cpu size={24} />
          </div>
          <h1 className="heading-elite" style={{ fontSize: '2rem', marginBottom: '8px' }}>Operator Onboarding.</h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', fontWeight: 500 }}>Join the ApplianceIQ network.</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
            <input 
              type="text" 
              placeholder="Full Name" 
              className="input-elite" 
              style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px' }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
            <input 
              type="email" 
              placeholder="System Email" 
              className="input-elite" 
              style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px' }}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          {/* Designer Role Toggle */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '14px', border: 'var(--border-thin)', display: 'flex', gap: '4px' }}>
            {[
              { id: 'business_owner', label: 'Business Owner' },
              { id: 'admin', label: 'System Admin' }
            ].map(role => (
              <button 
                key={role.id}
                type="button"
                onClick={() => setFormData({...formData, role: role.id})}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                  background: formData.role === role.id ? 'var(--color-text-primary)' : 'transparent',
                  color: formData.role === role.id ? 'var(--color-bg-base)' : 'var(--color-text-dim)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {role.label}
              </button>
            ))}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-elite" 
            style={{ width: '100%', padding: '18px', borderRadius: '14px' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" size={20} /> : <>Initialize Account <ArrowRight size={18} /></>}
          </motion.button>
        </form>

        <footer style={{ marginTop: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
            Already registered? <Link to="/login" style={{ color: 'var(--color-text-primary)', fontWeight: 700, textDecoration: 'none' }}>Access Portal</Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}