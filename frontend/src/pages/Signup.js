import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Cpu, Loader2, ArrowRight, QrCode, Database, Layers, CheckCircle2, Shield } from 'lucide-react';
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
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex' }}>
      {/* ── Left Side: Form ── */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="animate-elite" style={{ width: '100%', maxWidth: '440px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '64px' }}>
            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
              <Cpu size={18} />
            </div>
            <span className="heading-elite" style={{ fontSize: '1.1rem', color: 'white' }}>ApplianceIQ</span>
          </Link>

          <div style={{ marginBottom: '40px' }}>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Initialize.</h1>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', lineHeight: 1.5 }}>Select your operational role and create your identity.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Role Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Operational Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'business_owner' })}
                  className={formData.role === 'business_owner' ? 'btn-elite' : 'btn-elite-ghost'}
                  style={{ padding: '12px', fontSize: '0.7rem' }}
                >
                  Business Owner
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={formData.role === 'admin' ? 'btn-elite' : 'btn-elite-ghost'}
                  style={{ padding: '12px', fontSize: '0.7rem' }}
                >
                   System Admin
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Identity</label>
              <input
                type="text"
                className="input-elite"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Work Email</label>
              <input
                type="email"
                className="input-elite"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Access Key</label>
              <input
                type="password"
                className="input-elite"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            
            <button type="submit" className="btn-elite" style={{ width: '100%', padding: '16px', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Initializing Profile...' : 'Initialize Account'} <ArrowRight size={16} />
            </button>
          </form>

          <p style={{ marginTop: '40px', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
            Already registered? <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>Access console</Link>
          </p>
        </div>
      </div>

      {/* ── Right Side: Impact Panel ── */}
      <div style={{ flex: '1.2', background: '#080A0F', borderLeft: 'var(--border-thin)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', padding: '60px' }}>
          <div className="elite-panel" style={{ padding: '40px', background: 'rgba(2, 4, 8, 0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            </div>
            
            <div style={{ marginBottom: '40px' }}>
              <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>MULTI_TENANT_GOVERNANCE</div>
              <h2 className="heading-elite" style={{ fontSize: '1.75rem', marginBottom: '16px' }}>Role-Based Control.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Whether you're managing a single business or an entire platform, our governance-first architecture scale with you.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: <Shield size={16} />, text: 'Superuser oversight for Platform Admins.' },
                { icon: <QrCode size={16} />, text: 'Resource management for Business Owners.' },
                { icon: <Database size={16} />, text: 'Secure, isolated data environments.' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: 'var(--border-thin)', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--color-accent)' }}>{item.icon}</div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <CheckCircle2 size={20} color="#10B981" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Join 1,400+ operators managing appliance intelligence.</span>
          </div>
        </div>
      </div>
    </div>
  );
}