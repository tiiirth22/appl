import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, BarChart, LogOut, FileText, QrCode, Loader, Eye, MessageSquare, Trash2, Calendar, Shield, ExternalLink, Download, Search, LayoutGrid, List } from 'lucide-react';
import { StatCard } from '../components/ui/stat-card';
import Navbar from '../components/ui/Navbar';

const ManualCard = ({ title, description, icon, onSecondaryClick, onPrimaryClick, secondaryText, primaryText, status, className, children }) => (
  <div className={`integration-card border border-white/10 rounded-2xl p-5 bg-white/5 dark:bg-[#101010] shadow-md flex flex-col gap-4 ${className || ''}`}>
    <div className="flex items-center gap-4">
      <div className="icon-wrapper p-3 bg-white/10 rounded-xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg m-0 truncate">{title}</h3>
        <p className="text-sm text-slate-400 m-0 truncate">{description}</p>
      </div>
      <span className={`px-2 py-1 text-xs font-semibold rounded-full shrink-0 ${status === 'Connected' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
        {status}
      </span>
    </div>
    {children}
    <div className="flex gap-2 mt-auto pt-2">
      {onSecondaryClick && (
        <button onClick={onSecondaryClick} className="flex-1 py-2 px-4 rounded-xl font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition text-sm">
          {secondaryText}
        </button>
      )}
      {onPrimaryClick && (
        <button onClick={onPrimaryClick} className="flex-1 py-2 px-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/20 text-sm">
          {primaryText}
        </button>
      )}
    </div>
  </div>
);

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

  return (
    <div className="dashboard-page">
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" />

      <div className="main-container">
        {/* Header Section */}
        <header className="page-header">
          <div className="header-left">
            <h1>Workspace Overview</h1>
            <p>Managing {manuals.length} active appliance manuals across your network.</p>
          </div>
          <Link to="/upload" className="cta-btn-primary">
            <Upload size={18} />
            Add New Resource
          </Link>
        </header>

        {/* Stats Grid using Watermelon-inspired styles */}
        <div className="stats-grid">
          <StatCard
            title="Total Manuals"
            amount={manuals.length.toString()}
            percentage="+12%"
            isPositive={true}
          />
          <StatCard
            title="Active Agents"
            amount={manuals.filter(m => m.status === 'completed').length.toString()}
            percentage="+5%"
            isPositive={true}
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by model or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button className="toggle-btn active"><LayoutGrid size={18} /></button>
            <button className="toggle-btn"><List size={18} /></button>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="resource-section">
          {loading ? (
            <div className="loading-state">
              <Loader className="spinner" size={40} />
              <span>Synchronizing vector library...</span>
            </div>
          ) : filteredManuals.length === 0 ? (
            <div className="empty-state-glass">
              <FileText size={64} className="text-muted" />
              <h3>No Resources Found</h3>
              <p>Try a different search term or upload a new manual.</p>
              <Link to="/upload" className="btn-outline">Upload Now</Link>
            </div>
          ) : (
            <div className="manual-grid">
              {filteredManuals.map((manual) => (
                <ManualCard
                  key={manual.id}
                  title={manual.model_name}
                  description={`${manual.version} • ${manual.region}`}
                  icon={<FileText size={24} className="text-primary" />}
                  onSecondaryClick={() => handleViewQR(manual.id)}
                  onPrimaryClick={() => window.location.href = `/chat?manual_id=${manual.id}`}
                  secondaryText="View QR"
                  primaryText="Test Chat"
                  status={manual.status === 'completed' ? 'Connected' : 'Syncing'}
                  className="manual-integration-card"
                >
                  {/* Custom middle content for the integration card */}
                  <div className="card-extra-info">
                    <div className="extra-row">
                      <span>Source: {manual.filename}</span>
                    </div>
                    <div className="extra-row actions">
                      <button className="delete-mini" onClick={() => handleDeleteManual(manual.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </ManualCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern QR Modal */}
      {selectedQR && (
        <div className="modal-overlay" onClick={() => setSelectedQR(null)}>
          <div className="modal-glass-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <QrCode size={20} className="text-primary" />
                <h3>Resource Access Code</h3>
              </div>
              <button className="close-circle" onClick={() => setSelectedQR(null)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="qr-container-premium">
                <img src={selectedQR.image} alt="QR Code" />
                <div className="qr-glow"></div>
              </div>

              <div className="qr-details">
                <div className="url-badge">
                  <ExternalLink size={14} />
                  <span>{selectedQR.url}</span>
                </div>
                <p>Deploy this QR code on physical hardware to enable instant AI support for your users.</p>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-premium primary"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedQR.image;
                    link.download = `qr-${selectedQR.qr_id}.png`;
                    link.click();
                  }}
                >
                  <Download size={18} />
                  Export Assets
                </button>
                <button className="btn-premium secondary" onClick={() => setSelectedQR(null)}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #09090b;
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .main-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 3rem;
        }

        .page-header h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.05em; margin: 0; }
        .page-header p { color: #64748b; margin-top: 0.5rem; font-size: 1rem; }

        .cta-btn-primary {
            background: #3b82f6;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 1rem;
            font-weight: 700;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: 0.2s;
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }
        .cta-btn-primary:hover {
            background: #2563eb;
            transform: translateY(-2px);
        }

        /* Stats override */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .filter-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            background: rgba(15, 23, 42, 0.4);
            padding: 0.75rem;
            border-radius: 1.25rem;
            border: 1px solid rgba(255,255,255,0.05);
        }

        .search-box {
            position: relative;
            flex: 1;
            max-width: 400px;
        }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #475569; }
        .search-box input {
            width: 100%;
            background: rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 0.625rem 1rem 0.625rem 3rem;
            border-radius: 0.875rem;
            color: white;
            font-size: 0.875rem;
        }
        .search-box input:focus { outline: none; border-color: #3b82f6; }

        .view-toggle { display: flex; gap: 0.5rem; }
        .toggle-btn {
            background: none;
            border: none;
            color: #475569;
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 0.5rem;
        }
        .toggle-btn.active { background: rgba(255,255,255,0.05); color: white; }

        .manual-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 2rem;
        }

        /* Integration Card Custom Content */
        .card-extra-info {
            margin: 1.25rem 0;
            padding: 1rem;
            background: rgba(0,0,0,0.2);
            border-radius: 0.875rem;
            font-size: 0.75rem;
            color: #64748b;
        }
        .extra-row { margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .extra-row.actions { margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem; display: flex; justify-content: flex-end; }
        .delete-mini {
            background: none;
            border: none;
            color: #ef4444;
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.7rem;
            font-weight: 700;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            border-radius: 0.4rem;
        }
        .delete-mini:hover { background: rgba(239, 68, 68, 0.1); }

        .loading-state {
            padding: 5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            color: #64748b;
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .empty-state-glass {
            padding: 6rem;
            text-align: center;
            background: rgba(15, 23, 42, 0.3);
            border: 1px dashed rgba(255,255,255,0.1);
            border-radius: 3rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        .btn-outline {
            margin-top: 1rem;
            padding: 0.75rem 2rem;
            border: 1px solid #3b82f6;
            color: #3b82f6;
            text-decoration: none;
            border-radius: 1rem;
            font-weight: 700;
            transition: 0.2s;
        }
        .btn-outline:hover { background: rgba(59, 130, 246, 0.1); }

        /* Modal Glass */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.85);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-glass-content {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 2.5rem;
            padding: 3rem;
            width: 95%;
            max-width: 480px;
            box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
            animation: modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalScale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .modal-title { display: flex; align-items: center; gap: 0.75rem; }
        .modal-title h3 { font-size: 1.25rem; font-weight: 800; margin: 0; letter-spacing: -0.05em; }
        .close-circle { background: rgba(255,255,255,0.05); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1.25rem; }

        .qr-container-premium {
            position: relative;
            background: white;
            padding: 2.5rem;
            border-radius: 2rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: center;
        }
        .qr-container-premium img { width: 100%; max-width: 240px; mix-blend-mode: multiply; }
        .qr-glow {
            position: absolute;
            inset: 0;
            border-radius: 2rem;
            box-shadow: inset 0 0 30px rgba(59, 130, 246, 0.2);
            pointer-events: none;
        }

        .qr-details { text-align: center; margin-bottom: 2.5rem; }
        .url-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(37, 99, 235, 0.1);
            border: 1px solid rgba(37, 99, 235, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            color: #60a5fa;
            font-family: monospace;
            font-size: 0.8125rem;
            margin-bottom: 1rem;
        }
        .qr-details p { color: #64748b; font-size: 0.875rem; line-height: 1.5; margin: 0 auto; max-width: 300px; }

        .modal-actions { display: flex; gap: 1rem; }
        .btn-premium {
            flex: 1;
            padding: 1rem;
            border-radius: 1.25rem;
            border: none;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            transition: 0.2s;
        }
        .btn-premium.primary { background: #3b82f6; color: white; }
        .btn-premium.primary:hover { background: #2563eb; transform: translateY(-2px); }
        .btn-premium.secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); }
        .btn-premium.secondary:hover { background: rgba(255,255,255,0.1); }

        @media (max-width: 600px) {
            .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
            .modal-glass-content { padding: 2rem; }
        }
      `}</style>
    </div>
  );
}