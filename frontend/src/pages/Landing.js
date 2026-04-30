import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Scan, MessageSquare, ArrowRight, Shield, FileText, Search, Database, QrCode, Layers, ChevronRight } from 'lucide-react';
import Navbar from '../components/ui/Navbar';

export default function Landing({ currentTheme, toggleTheme }) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ paddingTop: '80px' }}>
        {/* ── Hero Section ── */}
        <section style={{ padding: '120px 40px 160px', textAlign: 'center', position: 'relative' }}>
          <div className="bg-aura" />
          <div className="animate-elite" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: 'var(--border-thin)', borderRadius: '100px', marginBottom: '32px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>v4.0 Obsidian Elite</span>
              <div style={{ width: '4px', height: '4px', background: 'var(--color-text-dim)', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-dim)' }}>Precision Engineering</span>
            </div>
            
            <h1 className="heading-elite" style={{ fontSize: '4.5rem', lineHeight: 0.95, marginBottom: '32px' }}>
              Engineered for <br /> Appliance Intelligence.
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
              A unified RAG ecosystem that transforms technical documentation into interactive diagnostic intelligence.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/signup" className="btn-elite" style={{ padding: '16px 32px', fontSize: '0.9rem' }}>Initialize Platform <ArrowRight size={18} /></Link>
              <a href="#features" className="btn-elite-ghost" style={{ padding: '16px 32px', fontSize: '0.9rem' }}>System Overview</a>
            </div>
          </div>
        </section>

        {/* ── Precision Showcase ── */}
        <section id="features" style={{ padding: '120px 40px', background: 'var(--color-bg-elevated)', borderTop: 'var(--border-thin)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 className="heading-elite" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Technical Capabilities.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem' }}>Bridging the gap between static manuals and real-world diagnostics.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
              {[
                { 
                  icon: <MessageSquare size={24} />, 
                  title: 'Vector RAG Chat', 
                  desc: 'Sub-200ms semantic retrieval across thousands of technical pages using Pinecone indexing.' 
                },
                { 
                  icon: <Scan size={24} />, 
                  title: 'Visual Ingestion', 
                  desc: 'Advanced OCR pipeline powered by Gemini 1.5 Flash Vision for real-time diagnostic analysis.' 
                },
                { 
                  icon: <QrCode size={24} />, 
                  title: 'QR Deployment', 
                  desc: 'Generate unique cryptographic QR identifiers for instant physical-to-digital diagnostic access.' 
                }
              ].map((feature, i) => (
                <div key={i} className="elite-panel" style={{ padding: '40px', transition: 'var(--transition-smooth)' }}>
                  <div style={{ color: 'var(--color-accent)', marginBottom: '24px' }}>{feature.icon}</div>
                  <h3 className="heading-elite" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>{feature.title}</h3>
                  <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Infrastructure Stack ── */}
        <section style={{ padding: '120px 40px', borderTop: 'var(--border-thin)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '16px', letterSpacing: '0.1em' }}>CORE_INFRASTRUCTURE</div>
              <h2 className="heading-elite" style={{ fontSize: '3rem', marginBottom: '24px', lineHeight: 1.1 }}>One Stack. <br /> Total Control.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.6 }}>
                Unified ML Service merging high-performance chat, ingestion, and vision diagnostics into a single sub-2GB memory footprint.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Motor / MongoDB Multi-tenant Auth', 'Quantized Llama 3.1 LLM Core', 'Real-time Ingestion Progress Visualization'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Shield size={16} color="var(--color-accent)" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="elite-panel" style={{ padding: '40px', background: 'rgba(255,255,255,0.01)' }}>
               <div style={{ borderBottom: 'var(--border-thin)', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>SYSTEM_HEALTH_MONITOR</span>
                  <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: 'var(--border-thin)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                      <div style={{ width: '40%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer style={{ padding: '80px 40px', borderTop: 'var(--border-thin)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>© 2026 ApplianceIQ Precision Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
