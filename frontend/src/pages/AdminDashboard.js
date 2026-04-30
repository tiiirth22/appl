import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, Loader, Users, Trash2, Search, Database, Server, Activity, Settings, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

export default function AdminDashboard({ user, onLogout, currentTheme, toggleTheme }) {
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
    if (!window.confirm('As Admin: Permanently delete this manual and its entire vector index?')) return;
    try {
      await axios.delete(`${API}/manuals/${manualId}`, { withCredentials: true });
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
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar
        user={user}
        onLogout={onLogout}
        activePage="dashboard"
        accentColor="#FFFFFF"
        roleLabel="Superuser"
        brandSuffix=" Console"
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        {/* Elite Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>SYSTEM_GOVERNANCE</div>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem' }}>Core Control.</h1>
            <p style={{ color: 'var(--color-text-dim)', marginTop: '8px', fontSize: '0.9rem' }}>Monitoring {users.length} operators and {manuals.length} indexed resources platform-wide.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-elite-ghost" style={{ padding: '8px 16px', fontSize: '0.7rem' }}><Settings size={14} /> CONFIG</button>
            <Link to="/upload" className="btn-elite" style={{ textDecoration: 'none' }}><Upload size={14} /> INITIALIZE</Link>
          </div>
        </header>

        {/* Elite KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', border: 'var(--border-thin)', borderRadius: '12px', overflow: 'hidden', marginBottom: '48px' }}>
          {[
            { label: 'Registered Operators', value: users.length, icon: <Users size={18} /> },
            { label: 'Global Knowledge Base', value: manuals.length, icon: <Database size={18} /> },
            { label: 'Active Vector Nodes', value: completedCount, icon: <Activity size={18} /> },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'var(--color-bg-elevated)', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{kpi.icon}</div>
                <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{kpi.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
          {/* Operator Management Registry */}
          <div className="elite-panel" style={{ padding: '0' }}>
            <div style={{ padding: '24px 32px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="heading-elite" style={{ fontSize: '1rem' }}>Operator Registry</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 16px', borderRadius: '6px', border: 'var(--border-thin)', width: '240px' }}>
                <Search size={14} color="var(--color-text-muted)" />
                <input
                  type="text"
                  placeholder="Search operators..."
                  style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ minHeight: '400px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 32px', background: 'rgba(255,255,255,0.02)', borderBottom: 'var(--border-thin)', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                <span>IDENTITY</span>
                <span>PERMISSION</span>
                <span>ASSETS</span>
                <span style={{ textAlign: 'right' }}>ESTABLISHED</span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}><Loader className="spinner" size={24} /></div>
              ) : (
                filteredUsers.map((u, i) => (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '20px 32px', borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', background: '#0B0F1A', border: 'var(--border-thin)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-dim)' }}>{u.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{u.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: u.role === 'admin' ? 'white' : 'var(--color-text-dim)', background: u.role === 'admin' ? 'rgba(255,255,255,0.05)' : 'transparent', padding: '4px 8px', borderRadius: '4px', border: u.role === 'admin' ? 'var(--border-thin)' : 'none' }}>
                        {u.role === 'admin' ? 'SUPERUSER' : 'OPERATOR'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Database size={12} /> {manuals.filter(m => m.user_id === u.id).length} docs
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(u.created_at || Date.now()).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Global Resource Stack */}
          <aside>
            <div className="elite-panel" style={{ padding: '0' }}>
               <div style={{ padding: '24px 32px', borderBottom: 'var(--border-thin)' }}>
                  <h3 className="heading-elite" style={{ fontSize: '1rem' }}>Global Assets</h3>
               </div>
               <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '20px' }}>
                  {manuals.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)', border: 'var(--border-thin)', borderRadius: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <div style={{ color: 'var(--color-text-muted)' }}><FileText size={16} /></div>
                         <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.model_name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{m.status === 'completed' ? 'INDEXED' : 'PROCESSING'}</div>
                         </div>
                      </div>
                      <button onClick={() => handleDeleteManual(m.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', opacity: 0.5 }}><Trash2 size={14} /></button>
                    </div>
                  ))}
               </div>
               <div style={{ padding: '24px', borderTop: 'var(--border-thin)', background: 'rgba(16, 185, 129, 0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10B981', fontSize: '0.75rem', fontWeight: 800 }}>
                     <ShieldCheck size={16} /> SYSTEM_HEALTH_NOMINAL
                  </div>
               </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}