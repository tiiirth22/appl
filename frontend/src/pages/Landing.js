import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Scan, MessageSquare, ArrowRight, Shield, BarChart3, PieChart, Activity, Globe, FileText, Search, Users, Database } from 'lucide-react';

export default function Landing() {
  return (
    <div className="page-container" style={{ padding: 0 }}>
      {/* ── Solid Navbar ── */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '72px', display: 'flex', alignItems: 'center',
        background: '#0B0F1A', borderBottom: '1px solid #1F2937'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Cpu size={18} />
            </div>
            <span className="heading-premium" style={{ fontSize: '1.1rem', color: 'white' }}>ApplianceIQ</span>
          </Link>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link to="/login" style={{ color: 'var(--color-text-dim)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Operator Login</Link>
            <Link to="/signup" className="btn-premium" style={{ padding: '10px 24px', fontSize: '0.8rem', borderRadius: '8px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: '#111827', border: '1px solid #1F2937', borderRadius: '4px', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '32px', letterSpacing: '0.05em' }}>
          <Zap size={14} /> NEW: ONNX-OPTIMIZED RAG ENGINE v2.0
        </div>
        
        <h1 className="heading-premium animate-reveal" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1.1, marginBottom: '24px' }}>
          The Intelligence Layer for <br/> <span style={{ color: 'var(--color-primary)' }}>Consumer Hardware.</span>
        </h1>
        
        <p className="animate-reveal" style={{ fontSize: '1.1rem', color: 'var(--color-text-dim)', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
          Transform legacy PDF manuals into high-fidelity AI agents. 
          Deploy instant technical support across your hardware fleet in minutes.
        </p>

        {/* ── Real Dashboard Alignment Mockup ── */}
        <div className="animate-reveal" style={{ marginTop: '40px', padding: '0 24px' }}>
          <div style={{ 
            maxWidth: '1100px', margin: '0 auto', 
            background: '#0B0F1A', border: '1px solid #1F2937', borderRadius: '12px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)', overflow: 'hidden'
          }}>
            {/* Real App Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Workspace Overview</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>Managing 12 indexed appliance manuals across the network.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '200px', background: '#111827', border: '1px solid #1F2937', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={14} color="#4B5563" />
                  <div style={{ width: '100px', height: '10px', background: '#1F2937', borderRadius: '2px' }} />
                </div>
                <div style={{ width: '100px', height: '36px', background: 'var(--color-primary)', borderRadius: '8px' }} />
              </div>
            </div>

            {/* Real KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '24px' }}>
              {[
                { icon: <FileText size={18} />, label: 'Total Manuals', value: '12', color: 'blue' },
                { icon: <Activity size={18} />, label: 'Active Agents', value: '10', color: 'emerald' },
                { icon: <Scan size={18} />, label: 'Deployments', value: '124', color: 'violet' }
              ].map((kpi, i) => (
                <div key={i} style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>{kpi.icon}</div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpi.value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Real Resource Table Mockup */}
            <div style={{ padding: '0 24px 24px', textAlign: 'left' }}>
              <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #1F2937', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>RESOURCE REGISTRY</div>
                {[
                  { model: 'SmartFreeze v2', file: 'manual_3002.pdf', status: 'ACTIVE' },
                  { model: 'AeroWash Pro', file: 'spec_4401.pdf', status: 'ACTIVE' },
                  { model: 'OmniHeat G3', file: 'guide_881.pdf', status: 'PROCESSING' }
                ].map((row, i) => (
                  <div key={i} style={{ padding: '16px 20px', borderBottom: i < 2 ? '1px solid #1F2937' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', background: '#1F2937', borderRadius: '6px' }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.model}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{row.file}</div>
                      </div>
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800, background: row.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: row.status === 'ACTIVE' ? '#10B981' : '#F59E0B' }}>{row.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid (Solid) ── */}
      <section className="page-container" style={{ paddingTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { icon: <Cpu />, title: 'Neural Ingestion', desc: 'Advanced OCR that understands complex technical diagrams and specs.' },
            { icon: <Zap />, title: 'Sub-200ms RAG', desc: 'Optimized ONNX engine for lightning-fast retrieval of manual sections.' },
            { icon: <Scan />, title: 'QR Deployments', desc: 'Physical-to-digital bridge for instant product support via QR.' },
            { icon: <MessageSquare />, title: 'Vision Support', desc: 'AI-powered image analysis to diagnose hardware issues instantly.' },
            { icon: <Shield />, title: 'Enterprise Auth', desc: 'Secure role-based access for business owners and admins.' },
            { icon: <BarChart3 />, title: 'Real-time Analytics', desc: 'Track query sentiment and retrieval accuracy live.' },
          ].map((f, i) => (
            <div key={i} className="glass-panel animate-reveal" style={{ padding: '32px', animationDelay: `${i * 0.1}s` }}>
              <div style={{ color: 'var(--color-primary)', marginBottom: '20px' }}>{f.icon}</div>
              <h3 className="heading-premium" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ marginTop: '100px', padding: '60px 24px', borderTop: '1px solid #1F2937', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          © 2026 ApplianceIQ. Built for the high-availability hardware era.
        </p>
      </footer>
    </div>
  );
}
