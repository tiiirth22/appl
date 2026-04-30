import React from 'react';
import { TrendingUp, Users, MessageSquare, Zap, Activity, Database, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import Navbar from '../components/ui/Navbar';

// ── Pure SVG Area Chart Component ──
const EliteAreaChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 400},${120 - (d.value / maxVal) * 100}`).join(' ');
  const areaPoints = `0,120 ${points} 400,120`;

  return (
    <svg width="100%" height="160" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid Lines */}
      {[0, 25, 50, 75, 100].map(y => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}
      {/* Area */}
      <polyline points={areaPoints} fill="url(#areaGradient)" />
      {/* Line */}
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
      {/* Data Points */}
      {data.map((d, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * 400} cy={120 - (d.value / maxVal) * 100} r="3" fill="var(--color-bg-base)" stroke="var(--color-accent)" strokeWidth="2" />
      ))}
    </svg>
  );
};

// ── Pure SVG Bar Chart Component ──
const EliteBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', gap: '8px', paddingBottom: '20px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: `${(d.value / maxVal) * 100}%`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: 'var(--color-accent)', opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics({ user, onLogout }) {
  const queryData = [
    { label: 'Mon', value: 400 }, { label: 'Tue', value: 300 }, { label: 'Wed', value: 600 },
    { label: 'Thu', value: 800 }, { label: 'Fri', value: 500 }, { label: 'Sat', value: 200 }, { label: 'Sun', value: 100 }
  ];

  const confidenceData = [
    { label: 'M', value: 92 }, { label: 'T', value: 88 }, { label: 'W', value: 95 },
    { label: 'T', value: 91 }, { label: 'F', value: 93 }, { label: 'S', value: 89 }, { label: 'S', value: 90 }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} activePage="analytics" />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>INTELLIGENCE_METRICS</div>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem' }}>System Insights.</h1>
            <p style={{ color: 'var(--color-text-dim)', marginTop: '8px', fontSize: '0.9rem' }}>Real-time analysis of RAG performance and user engagement.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-elite-ghost" style={{ padding: '8px 16px', fontSize: '0.7rem' }}>LAST 7 DAYS</button>
            <button className="btn-elite" style={{ padding: '8px 16px', fontSize: '0.7rem' }}>EXPORT DATA</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', border: 'var(--border-thin)', borderRadius: '12px', overflow: 'hidden', marginBottom: '48px' }}>
          {[
            { label: 'Total Queries', value: '4,281', trend: '+12%', icon: <MessageSquare size={16} /> },
            { label: 'Avg Confidence', value: '92.4%', trend: '+2%', icon: <Zap size={16} /> },
            { label: 'Active Users', value: '842', trend: '+18%', icon: <Users size={16} /> },
            { label: 'RAG Hit Rate', value: '98.9%', trend: '+0.5%', icon: <Activity size={16} /> }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--color-bg-elevated)', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{stat.icon}</div>
                <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 800 }}>{stat.trend}</div>
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
            <EliteAreaChart data={queryData} />
          </div>

          <div className="elite-panel" style={{ padding: '32px' }}>
            <h3 className="heading-elite" style={{ fontSize: '1rem', marginBottom: '40px' }}>Semantic Accuracy</h3>
            <EliteBarChart data={confidenceData} />
          </div>
        </div>

        <div className="elite-panel" style={{ marginTop: '32px', padding: '0' }}>
          <div style={{ padding: '24px 32px', borderBottom: 'var(--border-thin)' }}>
            <h3 className="heading-elite" style={{ fontSize: '1rem' }}>Top Ingested Manuals</h3>
          </div>
          <div style={{ padding: '20px 32px' }}>
            {[
              { name: 'Samsung Smart Fridge v2', queries: '1,240', score: '94%', trend: 'up' },
              { name: 'Tesla Wall Connector G3', queries: '890', score: '91%', trend: 'up' },
              { name: 'AeroWash Pro 4000', queries: '420', score: '88%', trend: 'down' }
            ].map((manual, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center' }}>
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
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>SEMANTIC SCORE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: manual.trend === 'up' ? '#10B981' : '#EF4444' }}>{manual.score}</div>
                  </div>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
