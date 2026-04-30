import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, ArrowLeft, Loader2, Mail, Lock, Cpu } from 'lucide-react';
import { API_BASE_URL as API } from '../config';

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      const { session_token, user } = response.data;
      onLogin(user, session_token);
      navigate('/dashboard');
    } catch (error) {
      const detail = error.response?.data?.detail || error.response?.data || error.message;
      setError(detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Link to="/" style={{ position: 'absolute', top: '40px', left: '40px', color: 'var(--color-text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="glass-panel animate-reveal" style={{ width: '100%', maxWidth: '440px', padding: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--color-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 24px' }}>
            <Cpu size={28} />
          </div>
          <h1 className="heading-premium" style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>Sign in to manage your AI fleet</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#F87171', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input name="email" type="email" className="input-premium" style={{ paddingLeft: '48px' }} placeholder="name@company.com" onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input name="password" type={showPassword ? 'text' : 'password'} className="input-premium" style={{ paddingLeft: '48px', paddingRight: '48px' }} placeholder="••••••••" onChange={handleChange} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-premium" style={{ width: '100%', padding: '16px' }} disabled={loading}>
            {loading ? <><Loader2 className="spinner" size={20} /> Authenticating...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
            New to ApplianceIQ? <Link to="/signup" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}