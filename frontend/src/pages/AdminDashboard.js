import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, BarChart, LogOut, FileText, QrCode, Loader, Users, Trash2, Shield, Calendar, Activity, Database, Server, Settings, Search, Filter } from 'lucide-react';
import { StatCard } from '../components/ui/stat-card';
import Navbar from '../components/ui/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user, onLogout }) {
  const [manuals, setManuals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDeleteManual = async (manualId) => {
    if (!window.confirm('As Admin: Permanently delete this manual and its entire vector index?')) {
      return;
    }

    try {
      await axios.delete(`${API}/manuals/${manualId}`, {
        withCredentials: true
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting manual:', error);
      alert('Failed to delete manual: ' + (error.response?.data?.detail || error.message));
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <Navbar
        user={user}
        onLogout={onLogout}
        activePage="dashboard"
        accentColor="#10b981"
        roleLabel="Superuser"
        brandSuffix="Console"
      />

      <div className="main-container">
        <header className="page-header">
          <div className="header-left">
            <h1>System Governance</h1>
            <p>Monitoring {users.length} operators and {manuals.length} vector-indexed resources.</p>
          </div>
          <div className="header-actions">
            <button className="btn-glass"><Settings size={18} /> Engine Config</button>
            <Link to="/upload" className="cta-btn-primary">
              <Upload size={18} />
              Global Upload
            </Link>
          </div>
        </header>

        {/* Admin Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Registered Users"
            amount={users.length.toString()}
            percentage="+15%"
            isPositive={true}
          />
          <StatCard
            title="Total Knowledge Base"
            amount={manuals.length.toString()}
            percentage="+22%"
            isPositive={true}
          />
          <StatCard
            title="Index Integrity"
            amount="99.9%"
            percentage="Stable"
            isPositive={true}
          />
        </div>

        <div className="admin-layout">
          {/* User Management Section */}
          <section className="admin-section">
            <div className="section-head">
              <div className="head-title">
                <Users size={20} className="text-primary" />
                <h2>Operator Management</h2>
              </div>
              <div className="head-tools">
                <div className="search-mini">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search operators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card table-card">
              {loading ? (
                <div className="loading-box"><Loader className="spinner" /></div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Identity</th>
                      <th>Role</th>
                      <th>Resources</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="ident-cell">
                            <div className="avatar-sm">{u.name.charAt(0)}</div>
                            <div className="ident-text">
                              <span className="u-name">{u.name}</span>
                              <span className="u-email">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'owner'}`}>
                            {u.role === 'admin' ? 'Superuser' : 'Merchant'}
                          </span>
                        </td>
                        <td>
                          <div className="resource-count">
                            <Database size={12} />
                            <span>{manuals.filter(m => m.user_id === u.id).length} docs</span>
                          </div>
                        </td>
                        <td className="time-text">{new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Manual Management Side Section */}
          <aside className="admin-section side">
            <div className="section-head">
              <div className="head-title">
                <FileText size={20} className="text-secondary" />
                <h2>Resource Health</h2>
              </div>
            </div>

            <div className="manual-scroll-stack">
              {manuals.map(m => (
                <div className="manual-item-glass" key={m.id}>
                  <div className="m-main">
                    <h4>{m.model_name}</h4>
                    <div className="m-sub">
                      <span>{m.status === 'completed' ? 'Fully Indexed' : 'Processing'}</span>
                      <span className="m-owner-ext">Owner: {m.user_id.split('@')[0]}</span>
                    </div>
                  </div>
                  <div className="m-actions">
                    <button className="del-btn" onClick={() => handleDeleteManual(m.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="system-health-card">
              <div className="health-row">
                <Server size={14} />
                <span>Llama 3.1 70B: Online</span>
              </div>
              <div className="health-row">
                <Activity size={14} />
                <span>Pinecone Latency: 45ms</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: #09090b;
          background-image: radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 40%);
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .main-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
        .page-header h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.05em; margin: 0; }
        .page-header p { color: #64748b; margin-top: 0.5rem; font-size: 1rem; }

        .header-actions { display: flex; gap: 1rem; }
        .btn-glass {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            color: white;
            padding: 0.75rem 1.25rem;
            border-radius: 1rem;
            display: flex; align-items: center; gap: 0.75rem;
            font-size: 0.875rem; font-weight: 600; cursor: pointer;
        }
        .cta-btn-primary {
            background: #10b981; color: white;
            padding: 0.75rem 1.5rem; border-radius: 1rem;
            font-weight: 700; text-decoration: none;
            display: flex; align-items: center; gap: 0.75rem;
            transition: 0.2s; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
        }
        .cta-btn-primary:hover { background: #059669; transform: translateY(-2px); }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3.5rem;
        }

        .admin-layout { display: grid; grid-template-columns: 1.8fr 1fr; gap: 2.5rem; }

        .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .head-title { display: flex; align-items: center; gap: 0.75rem; }
        .head-title h2 { font-size: 1.25rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; }

        .search-mini {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            padding: 0.4rem 0.8rem; border-radius: 0.75rem;
            display: flex; align-items: center; gap: 0.5rem;
            color: #475569;
        }
        .search-mini input {
            background: none; border: none; color: white; font-size: 0.8125rem;
            width: 150px;
        }
        .search-mini input:focus { outline: none; width: 200px; transition: 0.3s; }

        .glass-card { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 2rem; overflow: hidden; }

        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 1.25rem 1.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .admin-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.02); }

        .ident-cell { display: flex; align-items: center; gap: 1rem; }
        .avatar-sm { width: 32px; height: 32px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #3b82f6; }
        .ident-text { display: flex; flex-direction: column; }
        .u-name { font-size: 0.875rem; font-weight: 700; }
        .u-email { font-size: 0.75rem; color: #64748b; }

        .role-badge { 
            font-size: 0.65rem; font-weight: 800; padding: 0.25rem 0.625rem; border-radius: 2rem; 
            text-transform: uppercase; letter-spacing: 0.02em;
        }
        .role-badge.admin { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .role-badge.owner { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .resource-count { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.75rem; }
        .time-text { font-size: 0.8125rem; color: #475569; }

        .manual-scroll-stack { display: flex; flex-direction: column; gap: 1rem; }
        .manual-item-glass {
            background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
            padding: 1.25rem; border-radius: 1.5rem; display: flex; justify-content: space-between; align-items: center;
            transition: 0.2s;
        }
        .manual-item-glass:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }

        .m-main h4 { margin: 0; font-size: 0.9375rem; font-weight: 700; }
        .m-sub { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.375rem; }
        .m-sub span { font-size: 0.6875rem; color: #64748b; }
        .m-owner-ext { font-family: monospace; }
        
        .del-btn { 
            background: rgba(255,255,255,0.03); border: none; color: #475569; 
            width: 32px; height: 32px; border-radius: 8px; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; transition: 0.2s;
        }
        .del-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .system-health-card {
            margin-top: 2rem; background: rgba(16, 185, 129, 0.05); padding: 1.5rem; border-radius: 1.5rem;
            border: 1px solid rgba(16, 185, 129, 0.1); display: flex; flex-direction: column; gap: 0.75rem;
        }
        .health-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; color: #10b981; font-weight: 600; }

        .loading-box { padding: 4rem; text-align: center; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1100px) { .admin-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}