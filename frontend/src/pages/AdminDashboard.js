import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, Loader, Users, Trash2, Search, Database, Server, Activity, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/ui/Navbar';

import { API_BASE_URL as API } from '../config';

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

  const completedCount = manuals.filter(m => m.status === 'completed').length;

  return (
    <div className="iq-admin" id="admin-dashboard">
      <Navbar
        user={user}
        onLogout={onLogout}
        activePage="dashboard"
        accentColor="#10B981"
        roleLabel="Superuser"
        brandSuffix=" Console"
      />

      <div className="iq-admin-main">
        <header className="iq-admin-header" id="admin-header">
          <div>
            <h1>System Governance</h1>
            <p>Monitoring {users.length} operators and {manuals.length} indexed resources.</p>
          </div>
          <div className="iq-admin-header-actions">
            <button className="iq-btn-glass">
              <Settings size={16} /> Config
            </button>
            <Link to="/upload" className="iq-btn-emerald" id="admin-upload-btn">
              <Upload size={16} /> Upload
            </Link>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="iq-admin-kpi" id="admin-kpis">
          {[
            { label: 'Registered Users', value: users.length, icon: <Users size={18} />, color: 'emerald' },
            { label: 'Knowledge Base', value: manuals.length, icon: <Database size={18} />, color: 'blue' },
            { label: 'Active Indexes', value: completedCount, icon: <Activity size={18} />, color: 'violet' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="iq-admin-kpi-card"
            >
              <div className={`iq-ak-icon ${kpi.color}`}>{kpi.icon}</div>
              <div className="iq-ak-body">
                <span className="iq-ak-value">{kpi.value}</span>
                <span className="iq-ak-label">{kpi.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="iq-admin-layout">
          {/* Operator Table */}
          <section className="iq-admin-section" id="operators-section">
            <div className="iq-section-head">
              <div className="iq-sh-title">
                <Users size={18} />
                <h2>Operator Management</h2>
              </div>
              <div className="iq-sh-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search operators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="search-operators"
                />
              </div>
            </div>

            <div className="iq-table-card">
              {loading ? (
                <div className="iq-loading"><Loader className="spinner" size={28} /></div>
              ) : (
                <table className="iq-table" id="operators-table">
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
                          <div className="iq-ident">
                            <div className="iq-ident-avatar">{u.name.charAt(0)}</div>
                            <div className="iq-ident-text">
                              <span className="iq-ident-name">{u.name}</span>
                              <span className="iq-ident-email">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`iq-role-badge ${u.role === 'admin' ? 'admin' : 'owner'}`}>
                            {u.role === 'admin' ? 'Superuser' : 'Merchant'}
                          </span>
                        </td>
                        <td>
                          <div className="iq-resource-count">
                            <Database size={12} />
                            <span>{manuals.filter(m => m.user_id === u.id).length} docs</span>
                          </div>
                        </td>
                        <td className="iq-time">{new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Resources Sidebar */}
          <aside className="iq-admin-aside" id="resources-aside">
            <div className="iq-section-head">
              <div className="iq-sh-title">
                <FileText size={18} />
                <h2>Resources</h2>
              </div>
            </div>

            <div className="iq-resource-stack">
              {manuals.map(m => (
                <div className="iq-resource-item" key={m.id}>
                  <div className="iq-ri-info">
                    <h4>{m.model_name}</h4>
                    <span>{m.status === 'completed' ? 'Indexed' : 'Processing'}</span>
                  </div>
                  <button className="iq-ri-delete" onClick={() => handleDeleteManual(m.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {manuals.length === 0 && (
                <p className="iq-no-data">No resources indexed yet.</p>
              )}
            </div>

            <div className="iq-health-card" id="system-health">
              <div className="iq-health-row">
                <Server size={14} />
                <span>Llama 3.1 70B: Online</span>
              </div>
              <div className="iq-health-row">
                <Activity size={14} />
                <span>Vector DB: Healthy</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .iq-admin {
          min-height: 100vh;
          background: #0B0F1A;
          color: #F9FAFB;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .iq-admin-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px;
        }

        .iq-admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .iq-admin-header h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; }
        .iq-admin-header p { color: #6B7280; margin-top: 4px; font-size: 0.9375rem; }
        .iq-admin-header-actions { display: flex; gap: 8px; }

        .iq-btn-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #D1D5DB;
          padding: 10px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms;
        }
        .iq-btn-glass:hover { background: rgba(255,255,255,0.08); }

        .iq-btn-emerald {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8125rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 200ms;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }
        .iq-btn-emerald:hover { transform: translateY(-1px); }

        /* KPI */
        .iq-admin-kpi {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .iq-admin-kpi-card {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 200ms;
        }
        .iq-admin-kpi-card:hover { border-color: rgba(255,255,255,0.12); }
        .iq-ak-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .iq-ak-icon.emerald { background: rgba(16,185,129,0.1); color: #10B981; }
        .iq-ak-icon.blue { background: rgba(59,130,246,0.1); color: #3B82F6; }
        .iq-ak-icon.violet { background: rgba(139,92,246,0.1); color: #8B5CF6; }
        .iq-ak-value { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em; display: block; line-height: 1; }
        .iq-ak-label { font-size: 0.75rem; color: #6B7280; font-weight: 500; display: block; margin-top: 4px; }

        /* Layout */
        .iq-admin-layout {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
        }

        .iq-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .iq-sh-title { display: flex; align-items: center; gap: 8px; color: #3B82F6; }
        .iq-sh-title h2 { font-size: 1rem; font-weight: 700; color: #F9FAFB; }
        .iq-sh-search {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4B5563;
        }
        .iq-sh-search input {
          background: none;
          border: none;
          color: #F9FAFB;
          font-size: 0.75rem;
          width: 140px;
          transition: width 200ms;
        }
        .iq-sh-search input:focus { outline: none; width: 180px; }

        .iq-table-card {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }
        .iq-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .iq-table th {
          padding: 14px 20px;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6B7280;
          font-weight: 700;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .iq-table td {
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          font-size: 0.8125rem;
        }
        .iq-table tr:hover td { background: rgba(255,255,255,0.02); }

        .iq-ident { display: flex; align-items: center; gap: 10px; }
        .iq-ident-avatar {
          width: 32px;
          height: 32px;
          background: #1F2937;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #3B82F6;
        }
        .iq-ident-name { display: block; font-weight: 600; font-size: 0.8125rem; }
        .iq-ident-email { display: block; font-size: 0.6875rem; color: #6B7280; }

        .iq-role-badge {
          font-size: 0.5625rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .iq-role-badge.admin { background: rgba(16,185,129,0.1); color: #10B981; }
        .iq-role-badge.owner { background: rgba(59,130,246,0.1); color: #3B82F6; }

        .iq-resource-count { display: flex; align-items: center; gap: 6px; color: #6B7280; font-size: 0.75rem; }
        .iq-time { color: #4B5563; font-size: 0.75rem; }

        /* Aside */
        .iq-resource-stack { display: flex; flex-direction: column; gap: 8px; }
        .iq-resource-item {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.06);
          padding: 16px;
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 200ms;
        }
        .iq-resource-item:hover { border-color: rgba(255,255,255,0.12); }
        .iq-ri-info h4 { font-size: 0.8125rem; font-weight: 600; margin: 0; }
        .iq-ri-info span { font-size: 0.6875rem; color: #6B7280; }
        .iq-ri-delete {
          background: rgba(255,255,255,0.04);
          border: none;
          color: #4B5563;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms;
        }
        .iq-ri-delete:hover { background: rgba(239,68,68,0.1); color: #EF4444; }

        .iq-no-data { color: #4B5563; font-size: 0.8125rem; text-align: center; padding: 32px; }

        .iq-health-card {
          margin-top: 16px;
          background: rgba(16,185,129,0.04);
          border: 1px solid rgba(16,185,129,0.1);
          padding: 20px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .iq-health-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #10B981;
          font-weight: 600;
        }

        .iq-loading { padding: 48px; text-align: center; }

        @media (max-width: 1100px) {
          .iq-admin-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .iq-admin-main { padding: 16px; }
          .iq-admin-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .iq-admin-kpi { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}