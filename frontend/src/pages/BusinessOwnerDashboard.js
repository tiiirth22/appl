import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, QrCode, Trash2, Search, Database, 
  Cpu, Activity, Zap, Shield, ChevronRight, Loader2, 
  Clock, CheckCircle2, AlertCircle, LayoutGrid, List,
  Settings, User as UserIcon, LogOut, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

// ── Designer Component: Bento Stat ──
const BentoStat = ({ label, value, sub, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    style={{ 
      background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', borderRadius: '24px', 
      padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden'
    }}
  >
    <div style={{ position: 'absolute', top: '16px', right: '16px', width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}` }} />
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>{value}</div>
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 500, marginTop: '16px' }}>{sub}</div>
  </motion.div>
);

export default function BusinessOwnerDashboard({ user, onLogout, currentTheme, toggleTheme }) {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    try {
      const response = await axios.get(`${API}/manuals`, { withCredentials: true });
      setManuals(response.data.manuals || []);
    } catch (error) {
      console.error('Error fetching manuals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Initialize permanent deletion protocol?')) return;
    try {
      await axios.delete(`${API}/manuals/${id}`, { withCredentials: true });
      fetchManuals();
    } catch (error) {
      alert('Deletion failed');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 40px' }}>
        {/* ── Dashboard Bento Header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', marginBottom: '24px' }}>
          {/* Welcome Panel */}
          <div style={{ gridColumn: 'span 8', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', borderRadius: '32px', padding: '64px', position: 'relative', overflow: 'hidden' }}>
            <div className="bg-aura" style={{ opacity: 0.05 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)', letterSpacing: '0.3em' }}>CONTROL_CENTER</span>
              </div>
              <h1 className="heading-elite" style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '16px' }}>Terminal: {user?.name.split(' ')[0]}.</h1>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '1.2rem', maxWidth: '400px' }}>Bridging your physical assets to the Neural Diagnostic Network.</p>
            </div>
          </div>

          {/* User Quick Stats */}
          <div style={{ gridColumn: 'span 4', display: 'grid', gridTemplateRows: '1fr 1fr', gap: '24px' }}>
            <BentoStat label="Identity" value={user?.role === 'admin' ? 'ADMIN' : 'OWNER'} sub="Security Tier: Elite" color="#3B82F6" delay={0.1} />
            <BentoStat label="Inferences" value="1.4k" sub="+12% from last cycle" color="#10B981" delay={0.2} />
          </div>
        </div>

        {/* ── Resource Command Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          {/* Registry List */}
          <div className="elite-panel" style={{ gridColumn: 'span 9', padding: '0', borderRadius: '32px', background: 'transparent', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '0 8px' }}>
              <h2 className="heading-elite" style={{ fontSize: '1.5rem' }}>Resource Registry</h2>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/upload'} 
                className="btn-elite" style={{ borderRadius: '14px', padding: '12px 32px' }}
              >
                <Plus size={18} /> Ingest Data
              </motion.button>
            </div>

            {loading ? (
              <div style={{ padding: '120px', textAlign: 'center' }}>
                <Loader2 className="spinner" size={40} color="var(--color-text-dim)" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {manuals.map((m, i) => (
                  <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ 
                      display: 'grid', gridTemplateColumns: '1fr 180px 180px 120px', alignItems: 'center',
                      padding: '24px 32px', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', borderRadius: '24px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: 'var(--border-thin)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{m.model_name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>IDX_{m.id.substring(0,8)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)' }}>{m.status.toUpperCase()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                       <button onClick={() => setSelectedQR(m)} className="btn-elite-ghost" style={{ width: '40px', height: '40px', borderRadius: '10px' }}><QrCode size={16} /></button>
                       <button onClick={() => handleDelete(m.id)} className="btn-elite-ghost" style={{ width: '40px', height: '40px', borderRadius: '10px', color: '#EF4444' }}><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions / Info */}
          <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="elite-panel" style={{ padding: '32px', borderRadius: '24px' }}>
              <div style={{ color: 'var(--color-accent)', marginBottom: '20px' }}><Info size={24} /></div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px' }}>System Purpose</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>
                You are managing a node in the Neural Diagnostic network. Each manual you ingest becomes a vector index used by the RAG engine to ground AI answers in technical truth.
              </p>
            </div>
            <div className="elite-panel" style={{ padding: '32px', borderRadius: '24px', background: 'var(--color-bg-base)' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '0.1em' }}>QUICK_ACCESS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn-elite-ghost" style={{ justifyContent: 'flex-start', padding: '12px', fontSize: '0.75rem' }}><Settings size={14} /> System Settings</button>
                <button className="btn-elite-ghost" style={{ justifyContent: 'flex-start', padding: '12px', fontSize: '0.75rem' }}><UserIcon size={14} /> Profile Bridge</button>
                <button onClick={onLogout} className="btn-elite-ghost" style={{ justifyContent: 'flex-start', padding: '12px', fontSize: '0.75rem', color: '#EF4444' }}><LogOut size={14} /> Terminate Session</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Modal */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(40px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedQR(null)}>
            <motion.div initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} style={{ width: '440px', background: 'var(--color-bg-elevated)', borderRadius: '32px', padding: '48px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ color: 'var(--color-accent)', marginBottom: '32px' }}><QrCode size={48} strokeWidth={1} /></div>
              <h2 className="heading-elite" style={{ fontSize: '1.75rem', marginBottom: '40px' }}>Diagnostic Access Bridge</h2>
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', display: 'inline-block', marginBottom: '40px' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/device/${selectedQR.id}`} alt="QR" /></div>
              <button onClick={() => setSelectedQR(null)} className="btn-elite" style={{ width: '100%', padding: '16px', borderRadius: '16px' }}>Dismiss Protocol</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}