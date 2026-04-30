import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Scan, MessageSquare, ArrowRight, Shield, FileText, Search, Database, QrCode, Layers, ChevronRight, Globe, Lock, Cpu as Chip } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/ui/Navbar';

export default function Landing({ currentTheme, toggleTheme }) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main>
        {/* ── High-Contrast Hero ── */}
        <section style={{ padding: '160px 40px 120px', textAlign: 'center', position: 'relative' }}>
          <div className="bg-aura" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: '1000px', margin: '0 auto' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(255,255,255,0.03)', border: 'var(--border-thin)', borderRadius: '100px', marginBottom: '40px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Retrieval-Augmented Intelligence v4.0</span>
            </div>
            
            <h1 className="heading-elite" style={{ fontSize: '6rem', lineHeight: 0.85, marginBottom: '40px', letterSpacing: '-0.05em' }}>
              Diagnostic <br /> Sovereignty.
            </h1>
            <p style={{ fontSize: '1.4rem', color: 'var(--color-text-dim)', maxWidth: '750px', margin: '0 auto 64px', lineHeight: 1.5, fontWeight: 500 }}>
              The high-performance RAG gateway that transforms static appliance manuals into interactive, context-aware diagnostic intelligence.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/signup" className="btn-elite" style={{ padding: '20px 48px', fontSize: '1rem', borderRadius: '14px' }}>Initialize Platform <ArrowRight size={20} style={{ marginLeft: '8px' }} /></Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a href="#vision" className="btn-elite-ghost" style={{ padding: '20px 48px', fontSize: '1rem', borderRadius: '14px' }}>System Architecture</a>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── Technical Showcase ── */}
        <section id="vision" style={{ padding: '120px 40px', borderTop: 'var(--border-thin)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              {[
                { 
                  icon: <Chip size={28} />, 
                  title: 'Vector Grounding', 
                  desc: 'Eliminate AI hallucinations. Every response is semantically anchored to your technical documentation via high-dimensional vector search.' 
                },
                { 
                  icon: <Globe size={28} />, 
                  title: 'Edge Integration', 
                  desc: 'Deploy diagnostic nodes instantly. Cryptographic QR identifiers provide unauthenticated, zero-friction access at the physical point of failure.' 
                },
                { 
                  icon: <Lock size={28} />, 
                  title: 'RBAC Infrastructure', 
                  desc: 'Secure multi-tenant management. Sophisticated role-based access control for Admins and Business Operators.' 
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{ 
                    padding: '48px', 
                    background: 'var(--color-bg-elevated)', 
                    border: 'var(--border-thin)', 
                    borderRadius: '24px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ color: 'var(--color-text-primary)', marginBottom: '32px' }}>{feature.icon}</div>
                  <h3 className="heading-elite" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>{feature.title}</h3>
                  <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', lineHeight: 1.6 }}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ingestion Pipeline ── */}
        <section style={{ padding: '160px 40px', background: 'var(--color-bg-elevated)', borderTop: 'var(--border-thin)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '100px', alignItems: 'center' }}>
            <div>
              <h2 className="heading-elite" style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '32px' }}>Neural <br /> Ingestion.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '48px' }}>
                Advanced OCR processing powered by Gemini 1.5 Flash Vision. Transform technical PDFs and visual schema into queryable knowledge in seconds.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                   <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>142ms</div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>RETRIEVAL LATENCY</div>
                </div>
                <div>
                   <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>95.8%</div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>OCR ACCURACY</div>
                </div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
               <div style={{ width: '100%', aspectRatio: '1', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', position: 'absolute', top: 0, left: 0 }} />
               <div className="elite-panel" style={{ padding: '48px', position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {[80, 60, 90, 40].map((w, i) => (
                       <div key={i} style={{ height: '2px', width: `${w}%`, background: 'var(--color-text-muted)', opacity: 0.2 }} />
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer style={{ padding: '120px 40px', textAlign: 'center', borderTop: 'var(--border-thin)' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>© 2026 ApplianceIQ Operations. Proprietary RAG Infrastructure.</p>
      </footer>
    </div>
  );
}
