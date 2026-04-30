import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, QrCode, Trash2, Search, ExternalLink, Database, 
  Cpu, Activity, Zap, Shield, ChevronRight, Loader2, 
  Clock, CheckCircle2, AlertCircle, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

// ── Dynamic Event Feed Component ──
const LiveEventFeed = () => {
  const [events, setEvents] = useState([
    { id: 1, type: 'system', msg: 'Neural Core Initialized', time: 'Just now' },
    { id: 2, type: 'auth', msg: 'Secure Handshake established', time: '2m ago' },
    { id: 3, type: 'vector', msg: 'Pinecone Index status: Healthy', time: '5m ago' }
  ]);

  return (
    <div className="elite-panel" style={{ padding: '24px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Terminal size={14} color="var(--color-accent)" />
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Operational Feed</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {events.map(event => (
          <div key={event.id} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '2px', background: 'var(--color-accent)', opacity: 0.2, borderRadius: '2px' }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{event.msg}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{event.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Kinetic KPI Card ──
const KineticCard = ({ icon, label, value, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02, translateY: -5 }}
    className="elite-panel" 
    style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}
  >
    <div style={{ 
      position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', 
      background: `radial-gradient(circle at top right, ${color}22 0%, transparent 70%)` 
    }} />
    <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>{icon}</div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
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
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        {/* Dynamic Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }}
              style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.15em' }}
            >
              CORE_SYSTEM_ACTIVE
            </motion.div>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem' }}>Resource Registry.</h1>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/upload'} 
            className="btn-elite"
          >
            <Plus size={18} /> INGEST MANUAL
          </motion.button>
        </header>

        {/* Dynamic KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
          <KineticCard icon={<Database size={20} />} label="Indexed Manuals" value={manuals.length} color="#FFFFFF" delay={0.1} />
          <KineticCard icon={<Activity size={20} />} label="System Load" value="Optimal" color="#10B981" delay={0.2} />
          <KineticCard icon={<Shield size={20} />} label="Security Tier" value="Elite" color="#3B82F6" delay={0.3} />
          <KineticCard icon={<Zap size={20} />} label="Latency" value="142ms" color="#F59E0B" delay={0.4} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          {/* Main Registry Table */}
          <div className="elite-panel" style={{ padding: '0' }}>
            <div style={{ padding: '24px 32px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="heading-elite" style={{ fontSize: '1rem' }}>Active Resource Pool</h3>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={14} />
                <input 
                  type="text" 
                  placeholder="Filter resources..." 
                  className="input-elite" 
                  style={{ padding: '8px 12px 8px 36px', fontSize: '0.75rem', width: '240px' }}
                />
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {loading ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                  <Loader2 className="spinner" size={32} color="var(--color-accent)" />
                  <p style={{ marginTop: '16px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>SYNCING REGISTRY...</p>
                </div>
              ) : manuals.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-dim)' }}>No manuals indexed. Start by ingesting a technical PDF.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {manuals.map((m, i) => (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 150px 150px 120px', 
                        alignItems: 'center', 
                        padding: '16px 24px', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: 'var(--border-thin)', 
                        borderRadius: '8px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#0D1117', border: 'var(--border-thin)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                          <Database size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.model_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>ID: {m.id.substring(0,8)}...</div>
                        </div>
                      </div>
                      
                      <div>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          padding: '4px 10px', 
                          borderRadius: '100px', 
                          background: m.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: m.status === 'completed' ? '#10B981' : '#F59E0B',
                          textTransform: 'uppercase'
                        }}>
                          {m.status}
                        </span>
                      </div>

                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {new Date(m.created_at).toLocaleDateString()}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedQR(m)} className="btn-elite-ghost" style={{ padding: '8px', borderRadius: '6px' }} title="Generate QR"><QrCode size={14} /></button>
                        <button onClick={() => handleDelete(m.id)} className="btn-elite-ghost" style={{ padding: '8px', borderRadius: '6px', color: '#EF4444' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <LiveEventFeed />
            <div className="elite-panel" style={{ padding: '24px', background: 'var(--color-accent)', color: 'var(--color-bg-base)' }}>
               <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px' }}>Security Protocol</h4>
               <p style={{ fontSize: '0.75rem', opacity: 0.8, lineHeight: 1.5, marginBottom: '16px' }}>All diagnostic sessions are end-to-end encrypted and audited in real-time.</p>
               <button className="btn-elite" style={{ background: 'var(--color-bg-base)', color: 'var(--color-accent)', width: '100%', padding: '10px', fontSize: '0.7rem' }}>VIEW COMPLIANCE LOGS</button>
            </div>
          </div>
        </div>
      </main>

      {/* QR Modal Overlay */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setSelectedQR(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="elite-panel"
              style={{ width: '400px', padding: '40px', textAlign: 'center', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ color: 'var(--color-accent)', marginBottom: '24px' }}><QrCode size={48} /></div>
              <h2 className="heading-elite" style={{ marginBottom: '8px' }}>Device Identifier</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', marginBottom: '32px' }}>Deployment ready for <strong>{selectedQR.model_name}</strong></p>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '32px' }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/device/${selectedQR.id}`} alt="QR Code" />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-elite" style={{ flex: 1 }}>PRINT LABEL</button>
                <button onClick={() => setSelectedQR(null)} className="btn-elite-ghost" style={{ flex: 1 }}>CLOSE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}