import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, BarChart, LogOut, FileText, QrCode, Loader, Eye, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BusinessOwnerDashboard({ user, onLogout }) {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

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

  return (
    <div className="dashboard" data-testid="business-owner-dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <h2 className="navbar-brand">ApplianceIQ</h2>
          <div className="navbar-links">
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
            <Link to="/upload" className="navbar-link" data-testid="upload-link">Upload Manual</Link>
            <Link to="/analytics" className="navbar-link">Analytics</Link>
          </div>
          <div className="navbar-user">
            <img src={user.picture || 'https://via.placeholder.com/40'} alt={user.name} />
            <span>{user.name}</span>
            <button onClick={onLogout} className="btn-logout" data-testid="logout-btn">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 data-testid="dashboard-title">Welcome back, {user.name}!</h1>
            <p>Manage your appliance manuals and view QR codes</p>
          </div>
          <Link to="/upload" className="btn btn-primary" data-testid="new-manual-btn">
            <Upload size={20} />
            Upload New Manual
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div>
              <div className="stat-value" data-testid="total-manuals">{manuals.length}</div>
              <div className="stat-label">My Manuals</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <QrCode size={24} />
            </div>
            <div>
              <div className="stat-value">{manuals.filter(m => m.qr_code_id).length}</div>
              <div className="stat-label">QR Codes Assigned</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart size={24} />
            </div>
            <div>
              <div className="stat-value">{manuals.filter(m => m.status === 'completed').length}</div>
              <div className="stat-label">Active Manuals</div>
            </div>
          </div>
        </div>

        {/* Manuals List */}
        <div className="manuals-section">
          <h2>My Manuals</h2>
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner" size={40} />
            </div>
          ) : manuals.length === 0 ? (
            <div className="empty-state" data-testid="empty-state">
              <FileText size={64} />
              <h3>No manuals yet</h3>
              <p>Upload your first appliance manual to get started</p>
              <Link to="/upload" className="btn btn-primary">
                <Upload size={20} />
                Upload Manual
              </Link>
            </div>
          ) : (
            <div className="manuals-grid" data-testid="manuals-list">
              {manuals.map((manual) => (
                <div key={manual.id} className="manual-card" data-testid={`manual-${manual.id}`}>
                  <div className="manual-header">
                    <h3>{manual.model_name}</h3>
                    <span className={`badge badge-${manual.status === 'completed' ? 'success' : manual.status === 'processing' ? 'warning' : 'error'}`}>
                      {manual.status}
                    </span>
                  </div>
                  <div className="manual-details">
                    <p><strong>Version:</strong> {manual.version}</p>
                    <p><strong>Region:</strong> {manual.region}</p>
                    <p><strong>Chunks:</strong> {manual.chunks_count || 0}</p>
                    {manual.qr_code_id && (
                      <div className="qr-section">
                        <p><strong>QR Code Assigned:</strong></p>
                        <div className="qr-display">
                          <QrCode size={32} />
                          <span>{manual.qr_code_id}</span>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewQR(manual.id)}
                            disabled={loadingQR}
                          >
                            <Eye size={16} />
                            {loadingQR && selectedQR?.qr_id === manual.qr_code_id ? 'Loading...' : 'View QR'}
                          </button>
                          <Link
                            to={`/chat?manual_id=${manual.id}`}
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: '0.5rem' }}
                          >
                            <MessageSquare size={16} />
                            Test Assistant
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Modal */}
        {selectedQR && (
          <div className="modal-overlay" onClick={() => setSelectedQR(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>QR Code for {manuals.find(m => m.id === selectedQR.manual_id)?.model_name}</h2>
                <button className="btn-close" onClick={() => setSelectedQR(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="qr-image-container">
                  <img src={selectedQR.image} alt="QR Code" />
                </div>
                <div className="qr-info">
                  <p><strong>Short URL:</strong> {selectedQR.url}</p>
                  <p className="qr-hint">Scan this code with a mobile device to open the Chat Assistant.</p>
                </div>
                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedQR.image;
                      link.download = `qr-${selectedQR.qr_id}.png`;
                      link.click();
                    }}
                  >
                    Download PNG
                  </button>
                  <button className="btn btn-secondary" onClick={() => setSelectedQR(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 1rem;
          width: 90%;
          max-width: 500px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          margin: 0;
          color: #2d3748;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #a0aec0;
        }

        .qr-image-container {
          text-align: center;
          margin-bottom: 1.5rem;
          background: #f7fafc;
          padding: 2rem;
          border-radius: 0.5rem;
        }

        .qr-image-container img {
          max-width: 200px;
          height: auto;
        }

        .qr-info {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .qr-hint {
          font-size: 0.875rem;
          color: #718096;
          margin-top: 0.5rem;
        }
        .dashboard {
          min-height: 100vh;
          background: #f8fafc;
          color: #1e293b;
        }

        .navbar {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-brand {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .navbar-links {
          display: flex;
          gap: 2.5rem;
        }

        .navbar-link {
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        .navbar-link:hover {
          color: #6366f1;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .navbar-user img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
        }

        .btn-logout {
          background: #f1f5f9;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
        }

        .dashboard-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 0.5rem;
        }

        .dashboard-header p {
          color: #64748b;
          font-size: 1.125rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 4rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: transform 0.3s;
          border: 1px solid #f1f5f9;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          color: #6366f1;
          background: #eef2ff;
          padding: 1rem;
          border-radius: 1rem;
        }

        .stat-value {
          font-size: 2.25rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #64748b;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .manuals-section h2 {
          font-size: 1.875rem;
          font-weight: 800;
          margin-bottom: 2rem;
        }

        .manuals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .manual-card {
          background: white;
          border-radius: 1.25rem;
          padding: 2rem;
          border: 1px solid #f1f5f9;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .manual-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
          border-color: #6366f1;
        }

        .manual-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .manual-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .badge {
          padding: 0.375rem 0.875rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef9c3; color: #854d0e; }
        .badge-error { background: #fee2e2; color: #991b1b; }

        .manual-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .manual-details p { margin: 0; }
        .manual-details strong { color: #475569; }

        .qr-section {
          padding-top: 1.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .qr-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 1rem;
        }

        .qr-display span {
          flex: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #6366f1;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.75rem;
          border-radius: 0.75rem;
          font-weight: 700;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
        }

        .btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
          color: #1e293b;
        }

        .btn-sm {
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 2rem;
          width: 90%;
          max-width: 480px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalPop {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .modal-header h2 { font-size: 1.5rem; font-weight: 800; margin: 0; }

        .btn-close {
          background: #f1f5f9;
          border: none;
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          font-size: 1.25rem;
        }

        .qr-image-container {
          background: #f8fafc;
          padding: 2.5rem;
          border-radius: 1.5rem;
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
          border: 2px dashed #e2e8f0;
        }

        .qr-image-container img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
        }

        .qr-info { text-align: center; margin-bottom: 2rem; }
        .qr-info p { margin: 0.5rem 0; color: #475569; }
        .qr-hint { font-size: 0.875rem; color: #64748b; }

        .modal-actions {
          display: flex;
          gap: 1rem;
        }

        .modal-actions .btn { flex: 1; }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .manual-details { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}