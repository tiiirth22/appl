import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, QrCode, Loader, MessageSquare, Trash2, ExternalLink, Download, Search, LayoutGrid, TrendingUp, ArrowUpRight, BarChart3 } from 'lucide-react';
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
      const response = await axios.get(`${API}/manuals`, {
        withCredentials: true
      });
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
      const response = await axios.get(`${API}/manuals/${manualId}/qr`, {
        withCredentials: true
      });
      setSelectedQR(response.data);
    } catch (error) {
      console.error('Error fetching QR:', error);
      alert('Failed to fetch QR code');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDeleteManual = async (manualId) => {
    if (!window.confirm('Delete this manual and its AI index? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API}/manuals/${manualId}`, {
        withCredentials: true
      });
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
    <div className="iq-dash" id="business-dashboard">
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" />

      <div className="iq-dash-main">
        {/* Header */}
        <header className="iq-dash-header" id="dashboard-header">
          <div>
            <h1 id="dashboard-title">Workspace Overview</h1>
            <p>Managing {manuals.length} appliance {manuals.length === 1 ? 'manual' : 'manuals'} across your network.</p>
          </div>
          <Link to="/upload" className="iq-btn-action" id="upload-new-btn">
            <Upload size={16} />
            Upload Manual
          </Link>
        </header>

        {/* KPI Cards */}
        <div className="iq-kpi-grid" id="kpi-section">
          {[
            { label: 'Total Manuals', value: manuals.length, icon: <FileText size={18} />, color: 'blue' },
            { label: 'Active Agents', value: completedCount, icon: <BarChart3 size={18} />, color: 'emerald' },
            { label: 'QR Deployments', value: qrCount, icon: <QrCode size={18} />, color: 'violet' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="iq-kpi-card"
              id={`kpi-card-${i}`}
            >
              <div className={`iq-kpi-icon ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div className="iq-kpi-body">
                <span className="iq-kpi-value">{kpi.value}</span>
                <span className="iq-kpi-label">{kpi.label}</span>
              </div>
              <div className="iq-kpi-trend">
                <ArrowUpRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="iq-search-bar" id="search-section">
          <div className="iq-search-input">
            <Search size={16} className="iq-search-icon" />
            <input
              type="text"
              placeholder="Search by model or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="search-input"
            />
          </div>
        </div>

        {/* Resources Grid */}
        <section id="manuals-section">
          {loading ? (
            <div className="iq-loading">
              <Loader className="spinner" size={32} />
              <span>Loading manuals...</span>
            </div>
          ) : filteredManuals.length === 0 ? (
            <div className="iq-empty" id="empty-state">
              <div className="iq-empty-icon">
                <FileText size={40} />
              </div>
              <h3>No manuals found</h3>
              <p>{searchTerm ? 'Try a different search term.' : 'Upload your first appliance manual to get started.'}</p>
              {!searchTerm && (
                <Link to="/upload" className="iq-btn-outline" id="empty-upload-btn">
                  <Upload size={16} /> Upload Manual
                </Link>
              )}
            </div>
          ) : (
            <div className="iq-manual-grid" id="manuals-grid">
              <AnimatePresence>
                {filteredManuals.map((manual, i) => (
                  <motion.div
                    key={manual.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="iq-manual-card"
                    id={`manual-${manual.id}`}
                  >
                    <div className="iq-mc-top">
                      <div className="iq-mc-info">
                        <div className="iq-mc-icon">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h3>{manual.model_name}</h3>
                          <span className="iq-mc-meta">{manual.version} · {manual.region}</span>
                        </div>
                      </div>
                      <span className={`iq-mc-status ${manual.status === 'completed' ? 'success' : 'pending'}`}>
                        {manual.status === 'completed' ? 'Active' : 'Processing'}
                      </span>
                    </div>

                    <div className="iq-mc-details">
                      <span className="iq-mc-filename">{manual.filename}</span>
                      {manual.chunks_count > 0 && (
                        <span className="iq-mc-chunks">{manual.chunks_count} chunks indexed</span>
                      )}
                    </div>

                    <div className="iq-mc-actions">
                      <button className="iq-mc-btn secondary" onClick={() => handleViewQR(manual.id)}>
                        <QrCode size={14} /> View QR
                      </button>
                      <button className="iq-mc-btn primary" onClick={() => window.location.href = `/chat?manual_id=${manual.id}`}>
                        <MessageSquare size={14} /> Test Chat
                      </button>
                      <button className="iq-mc-btn danger" onClick={() => handleDeleteManual(manual.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div
            className="iq-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedQR(null)}
          >
            <motion.div
              className="iq-modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              id="qr-modal"
            >
              <div className="iq-modal-head">
                <div className="iq-modal-title">
                  <QrCode size={18} />
                  <h3>QR Access Code</h3>
                </div>
                <button className="iq-modal-close" onClick={() => setSelectedQR(null)}>×</button>
              </div>

              <div className="iq-modal-body">
                <div className="iq-qr-frame">
                  <img src={selectedQR.image} alt="QR Code" />
                </div>

                <div className="iq-qr-url">
                  <ExternalLink size={14} />
                  <span>{selectedQR.url}</span>
                </div>

                <p className="iq-qr-desc">Deploy this QR code on physical hardware to enable instant AI support.</p>

                <div className="iq-modal-actions">
                  <button
                    className="iq-btn-action"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedQR.image;
                      link.download = `qr-${selectedQR.qr_id}.png`;
                      link.click();
                    }}
                    id="download-qr-btn"
                  >
                    <Download size={16} /> Download QR
                  </button>
                  <button className="iq-btn-ghost" onClick={() => setSelectedQR(null)}>Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .iq-dash {
          min-height: 100vh;
          background: #0B0F1A;
          color: #F9FAFB;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .iq-dash-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px;
        }

        /* Header */
        .iq-dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .iq-dash-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .iq-dash-header p {
          color: #6B7280;
          margin-top: 4px;
          font-size: 0.9375rem;
        }

        /* Action Button */
        .iq-btn-action {
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8125rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: all 200ms;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25);
        }
        .iq-btn-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
        }

        .iq-btn-ghost {
          background: #1F2937;
          color: #F9FAFB;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8125rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: all 200ms;
        }
        .iq-btn-ghost:hover {
          background: #263244;
        }

        .iq-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3B82F6;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8125rem;
          text-decoration: none;
          transition: all 200ms;
          margin-top: 16px;
        }
        .iq-btn-outline:hover { background: rgba(59, 130, 246, 0.08); }

        /* KPI Grid */
        .iq-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .iq-kpi-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 200ms;
        }
        .iq-kpi-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .iq-kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .iq-kpi-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
        .iq-kpi-icon.emerald { background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .iq-kpi-icon.violet { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; }
        .iq-kpi-body {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .iq-kpi-value {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .iq-kpi-label {
          font-size: 0.75rem;
          color: #6B7280;
          font-weight: 500;
          margin-top: 4px;
        }
        .iq-kpi-trend {
          color: #10B981;
          opacity: 0.6;
        }

        /* Search */
        .iq-search-bar {
          margin-bottom: 24px;
        }
        .iq-search-input {
          position: relative;
          max-width: 400px;
        }
        .iq-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #4B5563;
        }
        .iq-search-input input {
          width: 100%;
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 10px 16px 10px 40px;
          border-radius: 12px;
          color: #F9FAFB;
          font-size: 0.8125rem;
          transition: all 200ms;
        }
        .iq-search-input input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }

        /* Loading / Empty */
        .iq-loading {
          padding: 80px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #6B7280;
        }
        .iq-empty {
          padding: 80px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .iq-empty-icon {
          width: 72px;
          height: 72px;
          background: rgba(59, 130, 246, 0.06);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3B82F6;
          margin-bottom: 8px;
        }
        .iq-empty h3 { font-size: 1.25rem; font-weight: 700; }
        .iq-empty p { color: #6B7280; font-size: 0.875rem; }

        /* Manual Grid */
        .iq-manual-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        .iq-manual-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          transition: all 200ms;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .iq-manual-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }

        .iq-mc-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .iq-mc-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .iq-mc-icon {
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.08);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3B82F6;
          flex-shrink: 0;
        }
        .iq-mc-info h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          margin: 0;
        }
        .iq-mc-meta {
          font-size: 0.75rem;
          color: #6B7280;
        }
        .iq-mc-status {
          font-size: 0.625rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .iq-mc-status.success { background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .iq-mc-status.pending { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }

        .iq-mc-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }
        .iq-mc-filename {
          font-size: 0.75rem;
          color: #6B7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .iq-mc-chunks {
          font-size: 0.6875rem;
          color: #4B5563;
        }

        .iq-mc-actions {
          display: flex;
          gap: 8px;
        }
        .iq-mc-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 200ms;
          border: none;
        }
        .iq-mc-btn.secondary {
          background: #1F2937;
          color: #D1D5DB;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .iq-mc-btn.secondary:hover { background: #263244; }
        .iq-mc-btn.primary {
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          color: white;
        }
        .iq-mc-btn.primary:hover { box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .iq-mc-btn.danger {
          background: rgba(239, 68, 68, 0.08);
          color: #EF4444;
          flex: 0;
          padding: 8px 10px;
        }
        .iq-mc-btn.danger:hover { background: rgba(239, 68, 68, 0.15); }

        /* Modal */
        .iq-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .iq-modal-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
        }
        .iq-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .iq-modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #3B82F6;
        }
        .iq-modal-title h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #F9FAFB;
        }
        .iq-modal-close {
          background: rgba(255, 255, 255, 0.04);
          border: none;
          color: #6B7280;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms;
        }
        .iq-modal-close:hover { background: rgba(255,255,255,0.08); color: white; }

        .iq-modal-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .iq-qr-frame {
          background: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 8px;
        }
        .iq-qr-frame img {
          width: 200px;
          height: 200px;
          display: block;
        }
        .iq-qr-url {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.15);
          padding: 6px 14px;
          border-radius: 9999px;
          color: #60A5FA;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
        }
        .iq-qr-desc {
          text-align: center;
          font-size: 0.8125rem;
          color: #6B7280;
          line-height: 1.5;
          max-width: 300px;
        }
        .iq-modal-actions {
          display: flex;
          gap: 12px;
          width: 100%;
          margin-top: 8px;
        }
        .iq-modal-actions .iq-btn-action,
        .iq-modal-actions .iq-btn-ghost { flex: 1; justify-content: center; }

        /* Responsive */
        @media (max-width: 768px) {
          .iq-dash-main { padding: 16px; }
          .iq-dash-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .iq-kpi-grid { grid-template-columns: 1fr; }
          .iq-manual-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}