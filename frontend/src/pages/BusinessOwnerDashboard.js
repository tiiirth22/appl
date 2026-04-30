import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, QrCode, Trash2, Search, Database, 
  Cpu, Activity, Zap, Shield, ChevronRight, Loader2, 
  Clock, CheckCircle2, AlertCircle, LayoutGrid, List,
  Settings, User as UserIcon, LogOut, Info, ExternalLink,
  ChevronDown, Filter, MoreHorizontal, Terminal, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

// ── Compact Metric Item ──
const MetricItem = ({ label, value, trend }) => (
  <div style={{ padding: '0 24px', borderRight: 'var(--border-thin)' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
      {trend && <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10B981' }}>{trend}</div>}
    </div>
  </div>
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
    if (!window.confirm('Terminate resource index permanently?')) return;
    try {
      await axios.delete(`${API}/manuals/${id}`, { withCredentials: true });
      fetchManuals();
    } catch (error) {
      alert('Action failed');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" currentTheme={currentTheme} toggleTheme={toggleTheme} />

      {/* ── Dashboard Sub-Header (Metric Strip) ── */}
      <div style={{ borderBottom: 'var(--border-thin)', background: 'var(--color-bg-elevated)', padding: '12px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'flex' }}>
          <MetricItem label="Neural Indices" value={manuals.length} />
          <MetricItem label="System Stability" value="99.9%" trend="↑" />
          <MetricItem label="Avg Latency" value="142ms" />
          <MetricItem label="Security Tier" value="RBAC" />
        </div>
      </div>

      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px 40px', flex: 1 }}>
        {/* ── Breadcrumbs & Actions ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '8px' }}>
              <span>Home</span> <ChevronRight size={12} /> <span style={{ color: 'var(--color-text-primary)' }}>Dashboard</span>
            </div>
            <h1 className="heading-elite" style={{ fontSize: '1.5rem' }}>Resource Management</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-elite-ghost"><Settings size={16} /> Config</button>
            <button onClick={() => window.location.href = '/upload'} className="btn-elite"><Plus size={16} /> Ingest Resource</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '32px', alignItems: 'start' }}>
          {/* ── Main Workspace (8 columns) ── */}
          <div style={{ gridColumn: 'span 8' }}>
            <div className="elite-panel" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Table Toolbar */}
              <div style={{ padding: '16px 24px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={14} />
                    <input type="text" placeholder="Search indices..." className="input-elite" style={{ padding: '6px 12px 6px 36px', fontSize: '0.8rem', width: '240px' }} />
                  </div>
                  <button className="btn-elite-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }}><Filter size={14} /> Filter</button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{manuals.length} total entries</div>
              </div>

              {/* High-Density Table */}
              <div style={{ width: '100%' }}>
                {loading ? (
                  <div style={{ padding: '80px', textAlign: 'center' }}><Loader2 className="spinner" size={24} color="var(--color-text-muted)" /></div>
                ) : manuals.length === 0 ? (
                  <div style={{ padding: '80px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--color-bg-surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--color-text-muted)' }}><Database size={24} /></div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>No resources indexed</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '24px' }}>Get started by ingesting your first diagnostic manual.</p>
                    <button onClick={() => window.location.href = '/upload'} className="btn-elite" style={{ margin: '0 auto' }}>Begin Ingestion Pipeline</button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: 'var(--border-thin)', background: 'rgba(255,255,255,0.01)' }}>
                        <th style={{ padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Identity / ID</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Timestamp</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manuals.map((m, i) => (
                        <tr key={m.id} style={{ borderBottom: i < manuals.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', transition: 'var(--transition-smooth)' }} className="table-row-hover">
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-base)', border: 'var(--border-thin)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><Database size={16} /></div>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.model_name}</div>
                                <div className="mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>{m.id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px', background: m.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: m.status === 'completed' ? '#10B981' : '#F59E0B', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                              {m.status}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{new Date(m.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                               <button onClick={() => setSelectedQR(m)} className="btn-elite-ghost" style={{ padding: '6px', borderRadius: '6px' }}><QrCode size={14} /></button>
                               <button onClick={() => handleDelete(m.id)} className="btn-elite-ghost" style={{ padding: '6px', borderRadius: '6px', color: '#EF4444' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* ── Side Actions (4 columns) ── */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="elite-panel">
               <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} color="var(--color-text-muted)" /> System Telemetry</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Neural Core', status: 'Online', val: '0.8% load' },
                    { label: 'Vector Mesh', status: 'Active', val: 'Pinecone-East' },
                    { label: 'CORS Proxy', status: 'Secure', val: 'TLS 1.3' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>{item.val}</div>
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10B981' }}>{item.status}</div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="elite-panel" style={{ background: 'var(--color-bg-base)' }}>
               <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '16px' }}>Quick Documentation</h3>
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', lineHeight: 1.6, marginBottom: '20px' }}>
                 New diagnostic manuals are processed using a vision-first RAG pipeline. Ensure high-contrast PDFs for optimal OCR performance.
               </p>
               <button className="btn-elite-ghost" style={{ width: '100%', justifyContent: 'center' }}>Explore API Docs <ExternalLink size={14} /></button>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedQR(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="elite-panel" style={{ width: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Diagnostic Access Bridge</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: '32px' }}>ID: <span className="mono">{selectedQR.id}</span></p>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '32px' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/device/${selectedQR.id}`} alt="QR" /></div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-elite" style={{ flex: 1 }}>Print Label</button>
                <button onClick={() => setSelectedQR(null)} className="btn-elite-ghost" style={{ flex: 1 }}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .table-row-hover:hover { background: rgba(255,255,255,0.02); }
      `}</style>
    </div>
  );
}