import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Cpu, Loader2, ArrowRight, QrCode, Database, Layers, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL as API } from '../config';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'business_owner' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/signup`, formData);
      alert('Account initialized. Please sign in.');
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed: ' + (error.response?.data?.detail || 'Check your details'));
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
            <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', lineHeight: 1.5 }}>Create your operator identity to start indexing your hardware knowledge.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Access Key (Min 8 chars)</label>
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
              <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>GLOBAL_DEPLOYMENT_STACK</div>
              <h2 className="heading-elite" style={{ fontSize: '1.75rem', marginBottom: '16px' }}>Physical-to-Digital.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every manual you upload becomes a unique RAG-node accessible via custom QR deployments.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: <QrCode size={16} />, text: 'One-click QR code generation.' },
                { icon: <Database size={16} />, text: 'Automated Pinecone vector indexing.' },
                { icon: <Layers size={16} />, text: 'Multi-tenant role-based governance.' }
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