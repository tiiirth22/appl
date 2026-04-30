import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Users, MessageSquare, Zap, Activity, Database, ArrowUpRight, ArrowDownRight, ChevronRight, Loader2 } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

// ── Pure SVG Area Chart Component ──
const EliteAreaChart = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-dim)' }}>Waiting for query data...</div>;
  
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * 400},${120 - (d.value / maxVal) * 100}`).join(' ');
  const areaPoints = `0,120 ${points} 400,120`;

  return (
    <svg width="100%" height="160" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(y => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}
      <polyline points={areaPoints} fill="url(#areaGradient)" />
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={(i / Math.max(data.length - 1, 1)) * 400} cy={120 - (d.value / maxVal) * 100} r="3" fill="var(--color-bg-base)" stroke="var(--color-accent)" strokeWidth="2" />
      ))}
    </svg>
  );
};

// ── Pure SVG Bar Chart Component ──
const EliteBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-dim)' }}>Aggregating scores...</div>;
  
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', gap: '8px', paddingBottom: '20px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: `${(d.value / maxVal) * 100}%`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: 'var(--color-accent)', opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics({ user, onLogout, currentTheme, toggleTheme }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQueries: 0,
    avgConfidence: 0,
    activeManuals: 0,
    hitRate: 0
  });
  const [chartData, setChartData] = useState({ volume: [], accuracy: [] });
  const [topManuals, setTopManuals] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [queriesRes, manualsRes] = await Promise.all([
        axios.get(`${API}/analytics/queries`, { withCredentials: true }),
        axios.get(`${API}/manuals`, { withCredentials: true })
      ]);

      const queries = queriesRes.data.queries || [];
      const manuals = manualsRes.data.manuals || [];

      // 1. Process Stats
      const avgConf = queries.length > 0 
        ? (queries.reduce((acc, q) => acc + (q.confidence || 0), 0) / queries.length) * 100 
        : 0;
      
      setStats({
        totalQueries: queries.length,
        avgConfidence: avgConf.toFixed(1),
        activeManuals: manuals.length,
        hitRate: queries.length > 0 ? ((queries.filter(q => q.confidence > 0.7).length / queries.length) * 100).toFixed(1) : 0
      });

      // 2. Process Volume Data (Group by Day)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      }).reverse();

      const volumeMap = {};
      queries.forEach(q => {
        const day = new Date(q.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        volumeMap[day] = (volumeMap[day] || 0) + 1;
      });

      setChartData({
        volume: last7Days.map(day => ({ label: day, value: volumeMap[day] || 0 })),
        accuracy: last7Days.map(day => {
          const dayQueries = queries.filter(q => new Date(q.created_at).toLocaleDateString('en-US', { weekday: 'short' }) === day);
          const dayAvg = dayQueries.length > 0 
            ? (dayQueries.reduce((acc, q) => acc + (q.confidence || 0), 0) / dayQueries.length) * 100 
            : 0;
          return { label: day, value: dayAvg };
        })
      });

      // 3. Process Top Manuals
      const manualCounts = {};
      queries.forEach(q => {
        manualCounts[q.manual_id] = (manualCounts[q.manual_id] || 0) + 1;
      });

      const top = manuals
        .map(m => ({
          name: m.model_name,
          queries: manualCounts[m.id] || 0,
          score: queries.filter(q => q.manual_id === m.id).length > 0 
            ? ((queries.filter(q => q.manual_id === m.id && q.confidence > 0.7).length / queries.filter(q => q.manual_id === m.id).length) * 100).toFixed(0) + '%'
            : '0%',
          trend: 'up'
        }))
        .sort((a, b) => b.queries - a.queries)
        .slice(0, 5);

      setTopManuals(top);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} activePage="analytics" currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>INTELLIGENCE_METRICS</div>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem' }}>System Insights.</h1>
            <p style={{ color: 'var(--color-text-dim)', marginTop: '8px', fontSize: '0.9rem' }}>Real-time analysis of RAG performance and user engagement.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchAnalytics} className="btn-elite-ghost" style={{ padding: '8px 16px', fontSize: '0.7rem' }}>
              {loading ? <Loader2 className="spinner" size={14} /> : 'REFRESH DATA'}
            </button>
          </div>
        </header>

        {/* Live KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', border: 'var(--border-thin)', borderRadius: '12px', overflow: 'hidden', marginBottom: '48px' }}>
          {[
            { label: 'Total Queries', value: stats.totalQueries, icon: <MessageSquare size={16} />, color: 'var(--color-accent)' },
            { label: 'Avg Confidence', value: stats.avgConfidence + '%', icon: <Zap size={16} />, color: '#F59E0B' },
            { label: 'Active Manuals', value: stats.activeManuals, icon: <Database size={16} />, color: '#3B82F6' },
            { label: 'RAG Hit Rate', value: stats.hitRate + '%', icon: <Activity size={16} />, color: '#10B981' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--color-bg-elevated)', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{stat.icon}</div>
                <div style={{ width: '8px', height: '8px', background: stat.color, borderRadius: '50%' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
          <div className="elite-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <h3 className="heading-elite" style={{ fontSize: '1rem' }}>Query Volume Stream</h3>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>UNIT: TOTAL_QUERIES</div>
            </div>
            <EliteAreaChart data={chartData.volume} />
          </div>

          <div className="elite-panel" style={{ padding: '32px' }}>
            <h3 className="heading-elite" style={{ fontSize: '1rem', marginBottom: '40px' }}>Semantic Accuracy</h3>
            <EliteBarChart data={chartData.accuracy} />
          </div>
        </div>

        {/* Dynamic Manual List */}
        <div className="elite-panel" style={{ marginTop: '32px', padding: '0' }}>
          <div style={{ padding: '24px 32px', borderBottom: 'var(--border-thin)' }}>
            <h3 className="heading-elite" style={{ fontSize: '1rem' }}>Active Resource performance</h3>
          </div>
          <div style={{ padding: '20px 32px' }}>
            {topManuals.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-dim)' }}>No manuals indexed yet.</div>
            ) : (
              topManuals.map((manual, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < topManuals.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#0D1117', border: 'var(--border-thin)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                      <Database size={14} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{manual.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>QUERIES</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{manual.queries}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>RAG CONFIDENCE</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10B981' }}>{manual.score}</div>
                    </div>
                    <ChevronRight size={16} color="var(--color-text-muted)" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
