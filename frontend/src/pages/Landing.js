import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, Zap, Scan, MessageSquare, ArrowRight, Shield, 
  FileText, Search, Database, QrCode, Layers, 
  ChevronRight, Globe, Lock, Binary, Activity, 
  BarChart3, HardDrive, Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/ui/Navbar';

export default function Landing({ currentTheme, toggleTheme }) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ flex: 1 }}>
        {/* ── High-Density Hero Section ── */}
        <section style={{ padding: '100px 40px 80px', borderBottom: 'var(--border-thin)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, padding: '4px 10px', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', borderRadius: '4px' }}>v4.0.2 Stable</span>
                <div style={{ width: '1px', height: '12px', background: 'var(--color-text-muted)', opacity: 0.3 }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>RAG_ORCHESTRATION_LAYER</span>
              </div>
              
              <h1 className="heading-elite" style={{ fontSize: '4rem', lineHeight: 1.05, marginBottom: '24px', maxWidth: '600px' }}>
                Engineered for <br /> Diagnostic Truth.
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-dim)', maxWidth: '500px', marginBottom: '48px', lineHeight: 1.5 }}>
                A unified RAG infrastructure that grounds AI diagnostics in technical documentation. No hallucinations. Just engineering precision.
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link to="/signup" className="btn-elite" style={{ padding: '12px 24px' }}>Get Started <ArrowRight size={16} /></Link>
                <a href="#core" className="btn-elite-ghost" style={{ padding: '12px 24px' }}>View Architecture</a>
              </div>
            </motion.div>

            {/* System Visualizer (Designer Component) */}
            <div className="elite-panel" style={{ height: '400px', position: 'relative', overflow: 'hidden', padding: '0', display: 'flex' }}>
              <div style={{ flex: 1, borderRight: 'var(--border-thin)', padding: '24px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                   <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>QUERY_INSPECTOR</span>
                   <div style={{ display: 'flex', gap: '4px' }}>
                      {[1,2,3].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />)}
                   </div>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[80, 60, 90, 40, 70].map((w, i) => (
                      <div key={i} style={{ height: '2px', width: `${w}%`, background: 'var(--color-text-muted)', opacity: i === 0 ? 0.4 : 0.1 }} />
                    ))}
                 </div>
                 <div style={{ marginTop: '40px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: 'var(--border-thin)', borderRadius: '8px' }}>
                    <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)' }}>{`{"status": "grounded", "confidence": 0.98}`}</div>
                 </div>
              </div>
              <div style={{ width: '120px', background: 'rgba(255,255,255,0.01)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {[Database, Layers, Activity].map((Icon, i) => (
                   <div key={i} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }}><Icon size={20} /></div>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── High-Density Feature Grid ── */}
        <section id="core" style={{ padding: '80px 40px', background: 'var(--color-bg-base)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
              {[
                { 
                  icon: <Layers size={20} />, 
                  title: 'Vector Ingestion', 
                  desc: 'Multi-stage processing pipeline for PDFs and visual diagnostics.' 
                },
                { 
                  icon: <Activity size={20} />, 
                  title: 'Semantic Retrieval', 
                  desc: 'Sub-200ms grounding using high-dimensional Pinecone indices.' 
                },
                { 
                  icon: <QrCode size={20} />, 
                  title: 'Edge Access', 
                  desc: 'Instant physical-to-digital diagnostic bridges via QR protocol.' 
                },
                { 
                  icon: <Shield size={20} />, 
                  title: 'RBAC Security', 
                  desc: 'Enterprise-grade role isolation and diagnostic audit trails.' 
                }
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ color: 'var(--color-text-primary)', marginBottom: '20px', opacity: 0.6 }}>{f.icon}</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── System Architecture (Condensed) ── */}
        <section style={{ padding: '80px 40px', background: 'var(--color-bg-elevated)', borderTop: 'var(--border-thin)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px', alignItems: 'center' }}>
             <div>
                <h2 className="heading-elite" style={{ fontSize: '2rem', marginBottom: '24px' }}>The Stack.</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { l: 'LLM CORE', v: 'Llama 3.1 / Gemini' },
                    { l: 'VECTOR STORE', v: 'Pinecone Serverless' },
                    { l: 'DATABASE', v: 'MongoDB Multi-tenant' },
                    { l: 'ORCHESTRATION', v: 'FastAPI / React' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{item.l}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.v}</span>
                    </div>
                  ))}
                </div>
             </div>
             <div className="elite-panel" style={{ background: 'var(--color-bg-base)', padding: '48px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                <div>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>142ms</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>P95 LATENCY</div>
                </div>
                <div>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>95.8%</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>OCR PRECISION</div>
                </div>
                <div>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>ISO</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>SECURITY STD</div>
                </div>
             </div>
          </div>
        </section>
      </main>

      <footer style={{ padding: '40px', borderTop: 'var(--border-thin)', textAlign: 'center' }}>
        <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>© 2026 APPLIANCE_IQ_INFRASTRUCTURE. STABLE_BUILD_4.0.2</p>
      </footer>
    </div>
  );
}
