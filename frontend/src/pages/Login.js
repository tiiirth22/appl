import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Cpu, Loader2, ArrowRight, Shield, Zap, Activity } from 'lucide-react';
import { API_BASE_URL as API } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + (error.response?.data?.detail || 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex' }}>
      {/* ── Left Side: Form ── */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="animate-elite" style={{ width: '100%', maxWidth: '400px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '64px' }}>
            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
              <Cpu size={18} />
            </div>
            <span className="heading-elite" style={{ fontSize: '1.1rem', color: 'white' }}>ApplianceIQ</span>
          </Link>

          <div style={{ marginBottom: '40px' }}>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Access Console.</h1>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', lineHeight: 1.5 }}>Initialize your session to manage your RAG-powered appliance fleet.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Operator Email</label>
              <input
                type="email"
                className="input-elite"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Access Key</label>
                <Link to="#" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 700 }}>Forgot Key?</Link>
              </div>
              <input
                type="password"
                className="input-elite"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-elite" style={{ width: '100%', padding: '16px', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'} <ArrowRight size={16} />
            </button>
          </form>

          <p style={{ marginTop: '40px', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
            New operator? <Link to="/signup" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>Initialize account</Link>
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
              <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>CORE_ENGINE_STATUS</div>
              <h2 className="heading-elite" style={{ fontSize: '1.75rem', marginBottom: '16px' }}>Neural Retrieval.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Our unified ML service handles sub-200ms RAG queries across your entire technical knowledge base.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: 'var(--border-thin)', borderRadius: '8px' }}>
                <Activity size={18} color="var(--color-accent)" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>98.9%</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>ACCURACY_HIT</div>
              </div>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: 'var(--border-thin)', borderRadius: '8px' }}>
                <Zap size={18} color="#10B981" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>162ms</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>AVG_LATENCY</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Shield size={20} color="var(--color-text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Enterprise-grade encryption enabled for all operator sessions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}