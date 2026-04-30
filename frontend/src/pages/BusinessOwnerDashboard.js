import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, QrCode, Trash2, Search, Database, 
  Cpu, Activity, Zap, Shield, ChevronRight, Loader2, 
  Clock, CheckCircle2, AlertCircle, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

// ── Designer Component: Premium Stat Card ──
const EliteStatCard = ({ icon, label, value, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -4 }}
    style={{ 
      background: 'var(--color-bg-elevated)',
      border: 'var(--border-thin)',
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 24px -1px rgba(0,0,0,0.2)'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '12px', 
        background: `rgba(255,255,255,0.03)`, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-dim)',
        border: 'var(--border-thin)'
      }}>
        {icon}
      </div>
      <div style={{ 
        width: '6px', height: '6px', borderRadius: '50%', background: color,
        boxShadow: `0 0 12px ${color}`
      }} />
    </div>
    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
  </motion.div>
);

export default function BusinessOwnerDashboard({ user, onLogout, currentTheme, toggleTheme }) {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);
  const [viewMode, setViewMode] = useState('list');

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

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 40px' }}>
        {/* ── Designer Header ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '1px', background: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>OPERATIONAL_INFRASTRUCTURE_V4.0</span>
            </div>
            <h1 className="heading-elite" style={{ fontSize: '3.5rem', lineHeight: 1 }}>Diagnostic Registry.</h1>
            <p style={{ color: 'var(--color-text-dim)', marginTop: '16px', fontSize: '1rem', fontWeight: 500 }}>Managing distributed diagnostic nodes and semantic indices.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => window.location.href = '/upload'} 
               className="btn-elite"
               style={{ borderRadius: '12px', padding: '16px 32px', boxShadow: '0 8px 24px rgba(255,255,255,0.1)' }}
             >
               <Plus size={18} /> Ingest Diagnostic Data
             </motion.button>
          </div>
        </header>

        {/* ── Metric Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '64px' }}>
          <EliteStatCard icon={<Database size={20} />} label="Active Indices" value={manuals.length} color="#FFFFFF" delay={0.1} />
          <EliteStatCard icon={<Activity size={20} />} label="Vector Health" value="Stable" color="#10B981" delay={0.2} />
          <EliteStatCard icon={<Shield size={20} />} label="Auth Protocol" value="RBAC" color="#3B82F6" delay={0.3} />
          <EliteStatCard icon={<Zap size={20} />} label="Inference Time" value="142ms" color="#F59E0B" delay={0.4} />
        </div>

        {/* ── Main Workspace ── */}
        <div className="elite-panel" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 className="heading-elite" style={{ fontSize: '1.25rem' }}>Resource Inventory</h2>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: 'var(--border-thin)' }}>
                <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: viewMode === 'list' ? 'white' : 'var(--color-text-muted)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}><List size={16} /></button>
                <button onClick={() => setViewMode('grid')} style={{ background: viewMode === 'grid' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: viewMode === 'grid' ? 'white' : 'var(--color-text-muted)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}><LayoutGrid size={16} /></button>
              </div>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
                <input type="text" placeholder="Filter diagnostic nodes..." className="input-elite" style={{ background: 'var(--color-bg-elevated)', borderRadius: '12px', padding: '12px 16px 12px 48px', width: '320px', fontSize: '0.85rem' }} />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '120px', textAlign: 'center' }}>
              <Loader2 className="spinner" size={40} color="var(--color-text-dim)" strokeWidth={1} />
              <div style={{ marginTop: '24px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>PULLING_SEMANTIC_RECORDS</div>
            </div>
          ) : manuals.length === 0 ? (
            <div className="elite-panel" style={{ padding: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
              <Database size={48} color="var(--color-text-muted)" style={{ marginBottom: '24px', opacity: 0.5 }} />
              <h3 className="heading-elite" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Infrastructure Empty</h3>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>Ingest your first technical resource to begin diagnostic indexing.</p>
            </div>
          ) : (
            <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', flexDirection: 'column', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {manuals.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: 'var(--border-thin)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                      <Database size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{m.model_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>IDX: {m.id.substring(0,8)}</span>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: m.status === 'completed' ? '#10B981' : '#F59E0B' }}>
                          {m.status === 'completed' ? 'SYNCHRONIZED' : 'PROCESSING'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                     <button onClick={() => setSelectedQR(m)} className="btn-elite-ghost" style={{ width: '44px', height: '44px', borderRadius: '12px' }}><QrCode size={18} /></button>
                     <button onClick={() => handleDelete(m.id)} className="btn-elite-ghost" style={{ width: '44px', height: '44px', borderRadius: '12px', color: '#EF4444' }}><Trash2 size={18} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {selectedQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(30px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedQR(null)}>
            <motion.div initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 30, opacity: 0 }} style={{ width: '480px', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', borderRadius: '32px', padding: '48px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ color: 'var(--color-accent)', marginBottom: '32px' }}><QrCode size={48} strokeWidth={1} /></div>
              <h2 className="heading-elite" style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Diagnostic Node</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', marginBottom: '40px', lineHeight: 1.5 }}>Deploying cryptographic access bridge for <br /><strong>{selectedQR.model_name}</strong></p>
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', display: 'inline-block', marginBottom: '40px' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/device/${selectedQR.id}`} alt="QR Code" style={{ display: 'block' }} /></div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-elite" style={{ flex: 1, borderRadius: '16px' }}>Generate Label</button>
                <button onClick={() => setSelectedQR(null)} className="btn-elite-ghost" style={{ flex: 1, borderRadius: '16px' }}>Dismiss</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}