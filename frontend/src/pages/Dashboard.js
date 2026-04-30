import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, Database, FileText, QrCode, 
  Loader2, ChevronRight, Activity, Zap, 
  Shield, Cpu, ArrowRight 
} from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { motion } from 'framer-motion';
import { API_BASE_URL as API } from '../config';

export default function Dashboard({ user, onLogout, currentTheme, toggleTheme }) {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    try {
      const response = await axios.get(`${API}/manuals`, { withCredentials: true });
      setManuals(response.data.manuals || []);
    } catch (error) {
      console.error('Error fetching manuals:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Role Redirection Logic ──
  if (user?.role === 'admin') return <Navigate to="/admin" />;
  if (user?.role === 'business_owner') return <Navigate to="/dashboard/owner" />;

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user} onLogout={onLogout} activePage="dashboard" currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '60px 40px', flex: 1 }}>
        <header style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }} />
            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>SYSTEM_READY_v4.0.2</span>
          </div>
          <h1 className="heading-elite" style={{ fontSize: '3rem', lineHeight: 1 }}>Intelligence Portal.</h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '1.1rem', marginTop: '16px' }}>Initializing diagnostic environment for <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{user?.name}</span>.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '32px' }}>
          <div style={{ gridColumn: 'span 8' }}>
            <div className="elite-panel" style={{ padding: '64px', textAlign: 'center', borderStyle: 'dashed', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '32px', opacity: 0.5 }}><Cpu size={64} strokeWidth={1} /></div>
              <h2 className="heading-elite" style={{ fontSize: '1.75rem', marginBottom: '16px' }}>Unified Registry.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto 48px' }}>
                Access the global diagnostic network to manage indices, analyze telemetry, and deploy physical-to-digital bridges.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <Link to="/upload" className="btn-elite" style={{ padding: '16px 32px', borderRadius: '100px' }}>Initialize Ingestion</Link>
                <Link to="/chat" className="btn-elite-ghost" style={{ padding: '16px 32px', borderRadius: '100px' }}>Diagnostic Terminal</Link>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '32px' }}>
             <div className="elite-panel">
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px' }}>Session Telemetry</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {[
                     { label: 'Role Authority', value: user?.role?.toUpperCase() || 'UNSET' },
                     { label: 'Network Latency', value: '142ms' },
                     { label: 'RAG Protocol', value: 'Grounded' }
                   ].map((item, i) => (
                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.value}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
