import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, Zap, Database, Activity, 
  Loader2, ChevronRight, BarChart3, Clock, 
  Target, Globe, Shield, Activity as ActivityIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

// ── Pure SVG Area Chart Component ──
const EliteAreaChart = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>SYNCHRONIZING_QUERY_STREAM...</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * 400},${120 - (d.value / maxVal) * 100}`).join(' ');
  const areaPoints = `0,120 ${points} 400,120`;
  return (
    <svg width="100%" height="160" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-text-primary)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--color-text-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />)}
      <polyline points={areaPoints} fill="url(#areaGradient)" />
      <polyline points={points} fill="none" stroke="var(--color-text-primary)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
};

// ── Pure SVG Bar Chart Component ──
const EliteBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>INDEXING_ACCURACY_DATA...</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '160px', gap: '8px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', height: `${(d.value / maxVal) * 100}%`, background: 'rgba(255,255,255,0.05)', border: 'var(--border-thin)', borderRadius: '4px', transition: 'var(--transition-smooth)' }} />
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

export default function Analytics({ user, onLogout, currentTheme, toggleTheme }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalQueries: 0, avgConfidence: 0, activeManuals: 0, hitRate: 0 });
  const [chartData, setChartData] = useState({ volume: [], accuracy: [] });
  const [topManuals, setTopManuals] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics`, { withCredentials: true });
      setStats(response.data.summary || stats);
      setChartData(response.data.charts || chartData);
      setTopManuals(response.data.topManuals || []);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user} onLogout={onLogout} activePage="analytics" currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px 40px' }}>
        <header style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            <span>Home</span> <ChevronRight size={12} /> <span style={{ color: 'var(--color-text-primary)' }}>Analytics</span>
          </div>
          <h1 className="heading-elite" style={{ fontSize: '1.5rem' }}>Platform Telemetry</h1>
        </header>

        {/* Pro KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {[
            { label: 'Total Inferences', value: stats.totalQueries, icon: <MessageSquare size={16} /> },
            { label: 'Confidence Floor', value: stats.avgConfidence + '%', icon: <Target size={16} /> },
            { label: 'Neural Capacity', value: stats.activeManuals, icon: <Database size={16} /> },
            { label: 'RAG Hit Rate', value: stats.hitRate + '%', icon: <ActivityIcon size={16} /> }
          ].map((stat, i) => (
            <div key={i} className="elite-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                <div style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>{stat.icon}</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div className="elite-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>QUERY_THROUGHPUT</h3>
              <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>UNIT: QPS</div>
            </div>
            <EliteAreaChart data={chartData.volume} />
          </div>

          <div className="elite-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px' }}>SEMANTIC_ACCURACY</h3>
            <EliteBarChart data={chartData.accuracy} />
          </div>
        </div>

        <div className="elite-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: 'var(--border-thin)', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>RESOURCE_PERFORMANCE_AUDIT</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-thin)', background: 'rgba(255,255,255,0.01)' }}>
                <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'left' }}>RESOURCE_IDENTITY</th>
                <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'left' }}>VOLUME</th>
                <th style={{ padding: '12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'right' }}>CONFIDENCE_AVG</th>
              </tr>
            </thead>
            <tbody>
              {topManuals.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '48px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No diagnostic telemetry recorded.</td></tr>
              ) : (
                topManuals.map((m, i) => (
                  <tr key={i} style={{ borderBottom: i < topManuals.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td style={{ padding: '12px 24px', fontSize: '0.85rem', fontWeight: 700 }}>{m.name}</td>
                    <td style={{ padding: '12px 24px', fontSize: '0.85rem' }}>{m.queries}</td>
                    <td style={{ padding: '12px 24px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 800, color: '#10B981' }}>{m.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
