import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, QrCode, Loader, MessageSquare, Trash2, ExternalLink, Download, Search, LayoutGrid, TrendingUp, ArrowUpRight, BarChart3, Plus, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/ui/Navbar';

import { API_BASE_URL as API } from '../config';

export default function BusinessOwnerDashboard({ user, onLogout }) {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleViewQR = async (manualId) => {
    setLoadingQR(true);
    try {
      const response = await axios.get(`${API}/manuals/${manualId}/qr`, { withCredentials: true });
      setSelectedQR(response.data);
    } catch (error) {
      console.error('Error fetching QR:', error);
      alert('Failed to fetch QR code');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDeleteManual = async (manualId) => {
    if (!window.confirm('Delete this manual and its AI index? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/manuals/${manualId}`, { withCredentials: true });
      fetchManuals();
    } catch (error) {
      console.error('Error deleting manual:', error);
      alert('Failed to delete manual: ' + (error.response?.data?.detail || error.message));
    }
  };

  const filteredManuals = manuals.filter(m =>
    m.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = manuals.filter(m => m.status === 'completed').length;
  const qrCount = manuals.filter(m => m.qr_code_id).length;

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        {/* Elite Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>WORKSPACE_OVERVIEW</div>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem' }}>Resource Registry.</h1>
            <p style={{ color: 'var(--color-text-dim)', marginTop: '8px', fontSize: '0.9rem' }}>Managing {manuals.length} technical assets across your network.</p>
          </div>
          <Link to="/upload" className="btn-elite" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> Initialize Manual
          </Link>
        </header>

        {/* Elite KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', border: 'var(--border-thin)', borderRadius: '12px', overflow: 'hidden', marginBottom: '48px' }}>
          {[
            { label: 'Indexed Manuals', value: manuals.length, icon: <FileText size={18} /> },
            { label: 'Active RAG Nodes', value: completedCount, icon: <BarChart3 size={18} /> },
            { label: 'QR Deployments', value: qrCount, icon: <QrCode size={18} /> },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'var(--color-bg-elevated)', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{kpi.icon}</div>
                <ArrowUpRight size={14} color="rgba(255,255,255,0.1)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{kpi.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Registry */}
        <div className="elite-panel" style={{ padding: '0' }}>
          <div style={{ padding: '24px 32px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 16px', borderRadius: '6px', border: 'var(--border-thin)', width: '400px' }}>
              <Search size={14} color="var(--color-text-muted)" />
              <input
                type="text"
                placeholder="Search registry by model..."
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', width: '100%', outline: 'none' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
               <button className="btn-elite-ghost" style={{ padding: '8px 16px', fontSize: '0.7rem' }}>Filter</button>
               <button className="btn-elite-ghost" style={{ padding: '8px 16px', fontSize: '0.7rem' }}>Export</button>
            </div>
          </div>

          <div style={{ minHeight: '400px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader className="spinner" size={24} color="var(--color-accent)" />
              </div>
            ) : filteredManuals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <FileText size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
                <h3 className="heading-elite" style={{ fontSize: '1.25rem' }}>No records found.</h3>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>{searchTerm ? 'Refine your search parameters.' : 'Start by initializing your first resource.'}</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 32px', background: 'rgba(255,255,255,0.02)', borderBottom: 'var(--border-thin)', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                  <span>IDENTITY</span>
                  <span>FILENAME</span>
                  <span>STATUS</span>
                  <span style={{ textAlign: 'right' }}>ACTIONS</span>
                </div>
                {filteredManuals.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '20px 32px', borderBottom: i < filteredManuals.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#0B0F1A', border: 'var(--border-thin)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                        <Database size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{m.model_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{m.version} · {m.region}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '20px' }}>{m.filename}</div>
                    <div>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, background: m.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: m.status === 'completed' ? '#10B981' : '#F59E0B' }}>
                        {m.status === 'completed' ? 'INDEXED' : 'PROCESSING'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-elite-ghost" style={{ padding: '6px 12px', fontSize: '0.65rem' }} onClick={() => handleViewQR(m.id)}>QR</button>
                      <button className="btn-elite" style={{ padding: '6px 12px', fontSize: '0.65rem' }} onClick={() => window.location.href = `/chat?manual_id=${m.id}`}>TEST</button>
                      <button className="btn-elite-ghost" style={{ padding: '6px 12px', fontSize: '0.65rem', border: 'none', color: '#EF4444' }} onClick={() => handleDeleteManual(m.id)}><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Elite Modal */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setSelectedQR(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="elite-panel"
              style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <QrCode size={20} color="var(--color-accent)" />
                  <span className="heading-elite" style={{ fontSize: '1.1rem' }}>QR Key</span>
                </div>
                <button onClick={() => setSelectedQR(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)' }}><X size={20} /></button>
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', display: 'inline-block', marginBottom: '24px' }}>
                <img src={selectedQR.image} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: 'var(--border-thin)', padding: '12px', borderRadius: '8px', color: 'var(--color-text-dim)', fontSize: '0.7rem', fontFamily: 'monospace', marginBottom: '32px', wordBreak: 'break-all' }}>
                {selectedQR.url}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button className="btn-elite" onClick={() => {
                   const link = document.createElement('a');
                   link.href = selectedQR.image;
                   link.download = `qr-${selectedQR.qr_id}.png`;
                   link.click();
                }}>Download</button>
                <button className="btn-elite-ghost" onClick={() => setSelectedQR(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}