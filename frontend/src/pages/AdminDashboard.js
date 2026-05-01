import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Database, Activity, Shield, 
  Loader2, Search, Trash2, ChevronRight, 
  Lock, Settings, BarChart3, Globe, Zap,
  Terminal, HardDrive, Cpu, MessageSquare, QrCode
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

const AdminStat = ({ label, value, icon: Icon, color }) => (
  <div className="elite-panel" style={{ padding: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ color: color, opacity: 0.8 }}><Icon size={14} /></div>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
  </div>
);

export default function AdminDashboard({ user, onLogout, currentTheme, toggleTheme }) {
  const [users, setUsers] = useState([]);
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, mRes] = await Promise.all([
        axios.get(`${API}/users`, { withCredentials: true }),
        axios.get(`${API}/manuals`, { withCredentials: true })
      ]);
      setUsers(uRes.data.users || []);
      setManuals(mRes.data.manuals || []);
    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" currentTheme={currentTheme} toggleTheme={toggleTheme} brandSuffix=" Admin" />

      <div style={{ borderBottom: 'var(--border-thin)', background: 'var(--color-bg-elevated)', padding: '12px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'flex', gap: '32px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%' }} /> NODE_CLUSTER_ACTIVE
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VERSION: 4.0.2_STABLE</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>AUTH: RBAC_ENFORCED</div>
        </div>
      </div>

      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px 40px', flex: 1 }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 className="heading-elite" style={{ fontSize: '1.5rem' }}>Infrastructure Control</h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>System-wide resource and identity management.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <AdminStat label="Total Personnel" value={users.length} icon={Users} color="#3B82F6" />
          <AdminStat label="Neural Indices" value={manuals.length} icon={Database} color="#FFFFFF" />
          <AdminStat label="System Load" value="0.08" icon={Activity} color="#10B981" />
          <AdminStat label="Uptime" value="99.9%" icon={Zap} color="#F59E0B" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', alignItems: 'start', marginBottom: '32px' }}>
          {/* ── User Directory (1.5fr) ── */}
          <div className="elite-panel" style={{ padding: '0', overflow: 'hidden' }}>
             <div style={{ padding: '16px 24px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>IDENTITY_REGISTRY</h3>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={12} />
                  <input type="text" placeholder="Search identities..." className="input-elite" style={{ padding: '6px 10px 6px 32px', fontSize: '0.75rem', width: '200px' }} />
                </div>
             </div>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ borderBottom: 'var(--border-thin)', background: 'rgba(255,255,255,0.01)' }}>
                   <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'left' }}>OPERATOR</th>
                   <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'left' }}>ROLE</th>
                   <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'right' }}>ACTIONS</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map((u, i) => (
                   <tr key={i} style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                     <td style={{ padding: '12px 24px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{u.name}</div>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                     </td>
                     <td style={{ padding: '12px 24px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: u.role === 'admin' ? '#EF4444' : 'var(--color-text-dim)', border: 'var(--border-thin)', padding: '2px 8px', borderRadius: '4px' }}>{u.role.toUpperCase()}</span>
                     </td>
                     <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                        <button className="btn-elite-ghost" style={{ padding: '6px', borderRadius: '6px' }}><Settings size={12} /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>

          {/* ── System Telemetry (1fr) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div className="elite-panel">
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal size={14} color="var(--color-text-muted)" /> SYSTEM_EVENT_LOG</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {[
                     { time: '12:04:22', event: 'RE_INDEX_SUCCESS', node: 'cluster-a' },
                     { time: '11:58:01', event: 'RBAC_CREDENTIAL_ROTATED', node: 'vault-01' },
                     { time: '11:45:12', event: 'ML_INFERENCE_OPTIMIZED', node: 'gpu-node-4' }
                   ].map((log, i) => (
                     <div key={i} className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', display: 'flex', gap: '12px' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>[{log.time}]</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{log.event}</span>
                        <span style={{ color: '#10B981' }}>{log.node}</span>
                     </div>
                   ))}
                 </div>
             </div>

             <div className="elite-panel" style={{ background: 'var(--color-bg-base)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '16px' }}>Diagnostic Readiness</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: '85%', height: '100%', background: 'var(--color-text-primary)' }} />
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>
                      <span>STORAGE_QUOTA</span>
                      <span>85% USED</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ── Global Manual Registry ── */}
        <div className="elite-panel" style={{ padding: '0', overflow: 'hidden' }}>
           <div style={{ padding: '16px 24px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>GLOBAL_RESOURCE_REGISTRY</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{manuals.length} total neural indices</div>
           </div>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
               <tr style={{ borderBottom: 'var(--border-thin)', background: 'rgba(255,255,255,0.01)' }}>
                 <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'left' }}>RESOURCE</th>
                 <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'left' }}>STATUS</th>
                 <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'right' }}>ACTIONS</th>
               </tr>
             </thead>
             <tbody>
               {manuals.map((m, i) => (
                 <tr key={i} style={{ borderBottom: i < manuals.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                   <td style={{ padding: '12px 24px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.model_name}</div>
                      <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{m.id}</div>
                   </td>
                   <td style={{ padding: '12px 24px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10B981', border: '1px solid #10B98133', padding: '2px 8px', borderRadius: '4px' }}>{m.status.toUpperCase()}</span>
                   </td>
                   <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => window.location.href = `/chat?manual_id=${m.id}`} className="btn-elite-ghost" style={{ padding: '6px', borderRadius: '6px' }}><MessageSquare size={12} /></button>
                        <button className="btn-elite-ghost" style={{ padding: '6px', borderRadius: '6px' }}><Settings size={12} /></button>
                      </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </main>
    </div>
  );
}