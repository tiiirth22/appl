import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, BarChart, FileText, QrCode, Loader } from 'lucide-react';
import Navbar from '../components/ui/Navbar';

import { API_BASE_URL as API } from '../config';

export default function Dashboard({ user, onLogout }) {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dashboard" data-testid="dashboard-page">
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" />

      {/* Main Content */}
      <div className="main-container">
        <div className="dashboard-header">
          <div>
            <h1 data-testid="dashboard-title">Welcome back, {user.name}!</h1>
            <p>Manage your appliance manuals and monitor customer queries</p>
          </div>
          <Link to="/upload" className="cta-btn-primary" data-testid="new-manual-btn">
            <Upload size={18} />
            Upload New Manual
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FileText size={24} />
            </div>
            <div>
              <div className="stat-value" data-testid="total-manuals">{manuals.length}</div>
              <div className="stat-label">Total Manuals</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <QrCode size={24} />
            </div>
            <div>
              <div className="stat-value">{manuals.filter(m => m.qr_code_id).length}</div>
              <div className="stat-label">QR Codes Generated</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
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
          <h2>Your Manuals</h2>
          {loading ? (
            <div className="loading-state">
              <Loader className="spinner" size={40} />
              <span>Loading manuals...</span>
            </div>
          ) : manuals.length === 0 ? (
            <div className="empty-state-glass" data-testid="empty-state">
              <FileText size={64} className="text-muted" />
              <h3>No manuals yet</h3>
              <p>Upload your first appliance manual to get started</p>
              <Link to="/upload" className="btn-outline">
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
                      <p><strong>QR Code:</strong> {manual.qr_code_id}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
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

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .dashboard-header h1 {
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          margin: 0;
        }

        .dashboard-header p {
          color: #64748b;
          margin-top: 0.5rem;
          font-size: 1rem;
        }

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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
          padding: 1.75rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.2s;
        }

        .stat-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.blue {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .stat-icon.green {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .stat-icon.purple {
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.05em;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .manuals-section h2 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .loading-state {
          padding: 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          color: #64748b;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-state-glass {
          padding: 6rem;
          text-align: center;
          background: rgba(15, 23, 42, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: #64748b;
        }

        .empty-state-glass h3 {
          font-size: 1.5rem;
          color: white;
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
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-outline:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .manuals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .manual-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .manual-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .manual-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .manual-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .manual-details p {
          margin-bottom: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .manual-details strong {
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
