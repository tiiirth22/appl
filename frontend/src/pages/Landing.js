import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Scan, MessageSquare, ArrowRight, Shield, FileText, Search, Database, QrCode, Layers, ChevronRight, Globe, Lock, Cpu as Chip, BarChart3, Binary } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/ui/Navbar';

export default function Landing({ currentTheme, toggleTheme }) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', color: 'var(--color-text-primary)', overflowX: 'hidden' }}>
      <Navbar currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main>
        {/* ── Section 1: The Manifest (Purpose) ── */}
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 40px', position: 'relative' }}>
          <div className="bg-aura" style={{ filter: 'blur(120px)', opacity: 0.15 }} />
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: '1200px', width: '100%', textAlign: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '48px' }}>
              <div style={{ width: '40px', height: '1px', background: 'var(--color-accent)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>THE_MANIFEST_v4.0</span>
              <div style={{ width: '40px', height: '1px', background: 'var(--color-accent)' }} />
            </div>

            <h1 className="heading-elite" style={{ fontSize: '7rem', lineHeight: 0.85, marginBottom: '64px', letterSpacing: '-0.06em' }}>
              Intelligence <br /> for the <br /> Physical World.
            </h1>

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', borderLeft: '2px solid var(--color-accent)', paddingLeft: '40px' }}>
              <p style={{ fontSize: '1.6rem', color: 'var(--color-text-dim)', lineHeight: 1.4, fontWeight: 500, marginBottom: '40px' }}>
                ApplianceIQ was engineered to solve a single, critical failure: <br />
                <span style={{ color: 'var(--color-text-primary)' }}>The disconnect between complex machinery and the humans who maintain them.</span>
              </p>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', lineHeight: 1.8, maxWidth: '600px' }}>
                We bridge this gap using a high-precision RAG (Retrieval-Augmented Generation) infrastructure, turning static technical manuals into live, conversational diagnostic brains.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '80px' }}>
              <Link to="/signup" className="btn-elite" style={{ padding: '24px 64px', fontSize: '1.1rem', borderRadius: '100px' }}>Initialize Platform</Link>
              <a href="#architecture" className="btn-elite-ghost" style={{ padding: '24px 64px', fontSize: '1.1rem', borderRadius: '100px' }}>The Architecture</a>
            </div>
          </motion.div>
        </section>

        {/* ── Section 2: The Bento Core (How it Works) ── */}
        <section id="architecture" style={{ padding: '160px 40px', borderTop: 'var(--border-thin)', background: 'var(--color-bg-elevated)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '80px' }}>
              <h2 className="heading-elite" style={{ fontSize: '3rem', marginBottom: '16px' }}>Precision Engineering.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '1.2rem' }}>Three layers of intelligence, one unified diagnostic pipeline.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', height: '800px' }}>
              {/* Layer 1: Neural Ingestion */}
              <motion.div 
                whileHover={{ y: -8 }}
                style={{ gridColumn: 'span 7', gridRow: 'span 1', background: 'var(--color-bg-base)', border: 'var(--border-thin)', borderRadius: '32px', padding: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ color: 'var(--color-accent)', marginBottom: '32px' }}><Layers size={40} strokeWidth={1} /></div>
                  <h3 className="heading-elite" style={{ fontSize: '2rem', marginBottom: '24px' }}>Neural Ingestion.</h3>
                  <p style={{ color: 'var(--color-text-dim)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '400px' }}>
                    Transforming raw PDFs and visual schema into semantic vectors using Gemini 1.5 Flash Vision.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['OCR', 'CHUNK', 'EMBED', 'IDX'].map(tag => (
                    <span key={tag} style={{ fontSize: '0.6rem', fontWeight: 900, padding: '4px 12px', border: 'var(--border-thin)', borderRadius: '100px', color: 'var(--color-text-muted)' }}>{tag}</span>
                  ))}
                </div>
              </motion.div>

              {/* Layer 2: Vector Store */}
              <motion.div 
                whileHover={{ y: -8 }}
                style={{ gridColumn: 'span 5', gridRow: 'span 2', background: 'var(--color-accent)', color: 'var(--color-bg-base)', borderRadius: '32px', padding: '64px', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.1 }}><Database size={300} /></div>
                <h3 className="heading-elite" style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '24px' }}>Grounding <br /> Truth.</h3>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.5, opacity: 0.8 }}>
                  Responses are strictly anchored to technical truth. Zero hallucinations. Total diagnostic accuracy.
                </p>
              </motion.div>

              {/* Layer 3: Edge Access */}
              <motion.div 
                whileHover={{ y: -8 }}
                style={{ gridColumn: 'span 4', gridRow: 'span 1', background: 'var(--color-bg-base)', border: 'var(--border-thin)', borderRadius: '32px', padding: '48px' }}
              >
                <div style={{ color: 'var(--color-text-primary)', marginBottom: '24px' }}><QrCode size={32} strokeWidth={1} /></div>
                <h4 className="heading-elite" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Edge Deployment.</h4>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Physical hardware mapped to digital intelligence via cryptographic identifiers.
                </p>
              </motion.div>

              {/* Layer 4: Real-time Analysis */}
              <motion.div 
                whileHover={{ y: -8 }}
                style={{ gridColumn: 'span 3', gridRow: 'span 1', background: 'var(--color-bg-base)', border: 'var(--border-thin)', borderRadius: '32px', padding: '48px' }}
              >
                <div style={{ color: 'var(--color-text-primary)', marginBottom: '24px' }}><Binary size={32} strokeWidth={1} /></div>
                <h4 className="heading-elite" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>142ms Latency.</h4>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Built for high-throughput operational environments.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Section 3: The Infrastructure (Value) ── */}
        <section style={{ padding: '160px 40px', background: 'var(--color-bg-base)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="heading-elite" style={{ fontSize: '4.5rem', lineHeight: 0.9, marginBottom: '48px' }}>One Stack. <br /> Absolute Control.</h2>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '1.4rem', lineHeight: 1.5, marginBottom: '80px' }}>
              ApplianceIQ is more than a tool. It's a high-performance operating system for technical diagnostics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              {[
                { label: 'Security', value: 'ISO-27001' },
                { label: 'Ingestion', value: 'Gemini 1.5' },
                { label: 'Architecture', value: 'RAG' }
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-muted)', marginBottom: '12px', letterSpacing: '0.2em' }}>{item.label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ padding: '120px 40px', borderTop: 'var(--border-thin)', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-muted)', letterSpacing: '0.3em', marginBottom: '32px' }}>APPLIANCEIQ_PRECISION_SYSTEMS</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>© 2026 Tirth J Dalal. All systems functional.</p>
      </footer>
    </div>
  );
}
