import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, BarChart, LogOut, FileText, QrCode, Loader, Users, Settings } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user, onLogout }) {
  const [manuals, setManuals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [manualsResponse, usersResponse] = await Promise.all([
        axios.get(`${API}/manuals`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true })
      ]);
      setManuals(manualsResponse.data.manuals || []);
      setUsers(usersResponse.data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard" data-testid="admin-dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <h2 className="navbar-brand">ApplianceIQ Admin</h2>
          <div className="navbar-links">
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
            <Link to="/upload" className="navbar-link" data-testid="upload-link">Upload Manual</Link>
            <Link to="/analytics" className="navbar-link">Analytics</Link>
            <Link to="/admin/users" className="navbar-link">Users</Link>
          </div>
          <div className="navbar-user">
            <img src={user.picture || 'https://via.placeholder.com/40'} alt={user.name} />
            <span>{user.name} (Admin)</span>
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
            <h1 data-testid="dashboard-title">Admin Dashboard</h1>
            <p>Manage system, users, and all appliance manuals</p>
          </div>
          <Link to="/upload" className="btn btn-primary" data-testid="new-manual-btn">
            <Upload size={20} />
            Upload Manual
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div>
              <div className="stat-value" data-testid="total-users">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
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

        {/* Users Section */}
        <div className="users-section">
          <h2>System Users</h2>
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner" size={40} />
            </div>
          ) : (
            <div className="users-grid">
              {users.map((u) => (
                <div key={u.id} className="user-card">
                  <div className="user-header">
                    <h3>{u.name}</h3>
                    <span className={`badge badge-${u.role === 'admin' ? 'primary' : 'secondary'}`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="user-details">
                    <p><strong>Email:</strong> {u.email}</p>
                    <p><strong>Joined:</strong> {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manuals List */}
        <div className="manuals-section">
          <h2>All Manuals</h2>
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner" size={40} />
            </div>
          ) : manuals.length === 0 ? (
            <div className="empty-state" data-testid="empty-state">
              <FileText size={64} />
              <h3>No manuals yet</h3>
              <p>Upload the first appliance manual to get started</p>
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
                    <p><strong>Owner:</strong> {users.find(u => u.id === manual.user_id)?.name || manual.user_id}</p>
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

        .navbar {
          background: white;
          border-bottom: 1px solid #e2e8f0;
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
          font-weight: bold;
          color: #2d3748;
          margin: 0;
        }

        .navbar-links {
          display: flex;
          gap: 2rem;
        }

        .navbar-link {
          color: #4a5568;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .navbar-link:hover {
          color: #2d3748;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .navbar-user img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .btn-logout {
          background: none;
          border: none;
          color: #4a5568;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }

        .btn-logout:hover {
          background: #f7fafc;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          color: #4299e1;
          background: #ebf8ff;
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #718096;
          font-size: 0.875rem;
        }

        .users-section, .manuals-section {
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .users-section h2, .manuals-section h2 {
          margin-bottom: 1.5rem;
          color: #2d3748;
        }

        .users-grid, .manuals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .user-card, .manual-card {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          transition: box-shadow 0.2s;
        }

        .user-card:hover, .manual-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .user-header, .manual-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .user-header h3, .manual-header h3 {
          margin: 0;
          color: #2d3748;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .badge-primary {
          background: #4299e1;
          color: white;
        }

        .badge-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .badge-success {
          background: #48bb78;
          color: white;
        }

        .badge-warning {
          background: #ed8936;
          color: white;
        }

        .badge-error {
          background: #f56565;
          color: white;
        }

        .user-details, .manual-details {
          color: #718096;
          font-size: 0.875rem;
        }

        .user-details p, .manual-details p {
          margin: 0.5rem 0;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 3rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #718096;
        }

        .empty-state h3 {
          margin: 1rem 0;
          color: #4a5568;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .btn-primary {
          background: #4299e1;
          color: white;
        }

        .btn-primary:hover {
          background: #3182ce;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }
      `}</style>
    </div>
  );
}