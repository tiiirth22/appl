import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, BarChart, LogOut, FileText, QrCode, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
            <p>Manage your appliance manuals and monitor customer queries</p>
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
              <div className="stat-label">Total Manuals</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <QrCode size={24} />
            </div>
            <div>
              <div className="stat-value">{manuals.filter(m => m.qr_code_id).length}</div>
              <div className="stat-label">QR Codes Generated</div>
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
          <h2>Your Manuals</h2>
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
          background: #f7fafc;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 2rem 0;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .dashboard-header p {
          color: #718096;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
        }

        .stat-label {
          color: #718096;
          font-size: 0.875rem;
        }

        .manuals-section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #2d3748;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          padding: 3rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          color: #718096;
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #2d3748;
        }

        .empty-state p {
          margin-bottom: 1.5rem;
        }

        .manuals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .manual-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .manual-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .manual-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .manual-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
        }

        .manual-details p {
          margin-bottom: 0.5rem;
          color: #718096;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
