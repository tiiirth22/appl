import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Scan, MessageSquare, ArrowRight, Shield, BarChart3, PieChart, Activity, Globe, FileText, Search, Users, Database, Terminal, Layers } from 'lucide-react';

export default function Landing() {
  return (
    <div className="page-container" style={{ padding: 0 }}>
      {/* ── Solid Navbar ── */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '72px', display: 'flex', alignItems: 'center',
        background: '#04070D', borderBottom: '1px solid #1F2937'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Cpu size={18} />
            </div>
            <span className="heading-premium" style={{ fontSize: '1.1rem', color: 'white' }}>ApplianceIQ</span>
          </Link>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#features" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Features</a>
              <a href="#mockup" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Dashboard</a>
            </div>
            <div style={{ width: '1px', height: '24px', background: '#1F2937' }} />
            <Link to="/login" style={{ color: 'var(--color-text-dim)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Login</Link>
            <Link to="/signup" className="btn-premium" style={{ padding: '10px 24px', fontSize: '0.8rem', borderRadius: '8px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{ paddingTop: '180px', paddingBottom: '100px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '4px', color: 'var(--color-primary)', fontSize: '0.65rem', fontWeight: 800, marginBottom: '32px', letterSpacing: '0.1em' }}>
          <Zap size={14} /> NEW: ONNX-OPTIMIZED RAG ENGINE v2.0
        </div>
        
        <h1 className="heading-premium animate-reveal" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', lineHeight: 1.05, marginBottom: '24px' }}>
          Infrastructure for <br/> <span style={{ color: 'var(--color-primary)' }}>AI Hardware Support.</span>
        </h1>
        
        <p className="animate-reveal" style={{ fontSize: '1.25rem', color: 'var(--color-text-dim)', maxWidth: '650px', margin: '0 auto 56px', lineHeight: 1.6 }}>
          Automate technical assistance at scale. From PDF ingestion to global QR deployment, manage your appliance intelligence in one console.
        </p>

        {/* ── HIGH-DENSITY DASHBOARD MOCKUP ── */}
        <div id="mockup" className="animate-reveal" style={{ marginTop: '40px', padding: '0 24px' }}>
          <div style={{ 
            maxWidth: '1200px', margin: '0 auto', 
            background: '#04070D', border: '1px solid #1F2937', borderRadius: '16px',
            boxShadow: '0 60px 120px rgba(0,0,0,0.8)', overflow: 'hidden'
          }}>
            {/* Command Bar */}
            <div style={{ padding: '16px 24px', background: '#0B0F1A', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#374151' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#374151' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#374151' }} />
                </div>
                <div style={{ width: '1px', height: '16px', background: '#1F2937' }} />
                <span style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: 'monospace', fontWeight: 600 }}>SYSTEM_CONTROL_CONSOLE_V3.1</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '120px', height: '28px', background: '#111827', borderRadius: '6px', border: '1px solid #1F2937' }} />
                <div style={{ width: '28px', height: '28px', background: '#1F2937', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '0' }}>
              {/* Sidebar Nav */}
              <div style={{ padding: '24px', borderRight: '1px solid #1F2937', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#4B5563', fontWeight: 800, marginBottom: '16px', letterSpacing: '0.05em' }}>CORE MODULES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { icon: <Layers size={14} />, label: 'Fleet Registry', active: true },
                      { icon: <Database size={14} />, label: 'Vector Stores', active: false },
                      { icon: <Activity size={14} />, label: 'Live Inference', active: false },
                      { icon: <Users size={14} />, label: 'Operator Hub', active: false }
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: item.active ? 'rgba(59, 130, 246, 0.05)' : 'transparent', color: item.active ? 'var(--color-primary)' : '#6B7280', fontSize: '0.8rem', fontWeight: 600 }}>
                        {item.icon} {item.label}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 800, marginBottom: '4px' }}>RAG NODE STATUS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>99.9% Uptime</span>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div style={{ background: '#0B0F1A', padding: '32px', textAlign: 'left' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                  {[
                    { label: 'Fleet Queries', value: '42.8k', trend: '+12%', icon: <MessageSquare size={18} /> },
                    { label: 'Avg Latency', value: '184ms', trend: '-14%', icon: <Zap size={18} /> },
                    { label: 'Hit Rate', value: '98.2%', trend: '+2%', icon: <BarChart3 size={18} /> }
                  ].map((stat, i) => (
                    <div key={i} style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ color: 'var(--color-primary)' }}>{stat.icon}</div>
                        <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 800 }}>{stat.trend}</div>
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                  {/* Performance Chart Mockup */}
                  <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>INFERENCE LATENCY (REAL-TIME)</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%' }} />
                        <div style={{ width: '8px', height: '8px', background: '#1F2937', borderRadius: '50%' }} />
                      </div>
                    </div>
                    {/* SVG Line Chart Mockup */}
                    <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none">
                      <path d="M0,80 Q50,70 100,90 T200,60 T300,80 T400,50" fill="none" stroke="var(--color-primary)" strokeWidth="3" />
                      <path d="M0,80 Q50,70 100,90 T200,60 T300,80 T400,50 L400,120 L0,120 Z" fill="rgba(59, 130, 246, 0.05)" />
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #1F2937', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#4B5563', fontWeight: 700 }}>08:00 AM</div>
                      <div style={{ fontSize: '0.65rem', color: '#4B5563', fontWeight: 700 }}>PROCESSED: 24,102 TOKENS</div>
                      <div style={{ fontSize: '0.65rem', color: '#4B5563', fontWeight: 700 }}>12:00 PM</div>
                    </div>
                  </div>

                  {/* Log Feed */}
                  <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '24px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4B5563', display: 'block', marginBottom: '16px', textTransform: 'uppercase' }}>SYSTEM LOGS</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { time: '14:22', event: 'Vector re-indexed: SM-90', color: '#10B981' },
                        { time: '14:21', event: 'New Query: Washing Machine', color: '#3B82F6' },
                        { time: '14:18', event: 'Vision Analysis: OK', color: '#8B5CF6' },
                        { time: '14:15', event: 'Deployment: QR-A102', color: '#3B82F6' }
                      ].map((log, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', borderLeft: `2px solid ${log.color}`, paddingLeft: '8px' }}>
                          <span style={{ color: '#4B5563', fontWeight: 700 }}>{log.time}</span>
                          <span style={{ color: '#9CA3AF' }}>{log.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="page-container" style={{ paddingTop: 0 }}>
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
