import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Scan, MessageSquare, ArrowRight, Shield, FileText, Search, Database, QrCode, Layers } from 'lucide-react';

export default function Landing() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      {/* ── Elite Navbar ── */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '80px', display: 'flex', alignItems: 'center',
        background: 'rgba(2, 4, 8, 0.95)', borderBottom: 'var(--border-thin)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
              <Cpu size={18} />
            </div>
            <span className="heading-elite" style={{ fontSize: '1.2rem', color: 'white' }}>ApplianceIQ</span>
          </Link>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, padding: '8px 16px' }}>Sign In</Link>
            <Link to="/signup" className="btn-elite" style={{ padding: '10px 24px', fontSize: '0.75rem' }}>Create Account</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{ paddingTop: '200px', paddingBottom: '120px', textAlign: 'center', maxWidth: '1400px', margin: '0 auto', paddingLeft: '40px', paddingRight: '40px' }}>
        <div className="animate-elite" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: 'var(--border-thin)', borderRadius: '4px', color: 'var(--color-text-dim)', fontSize: '0.65rem', fontWeight: 800, marginBottom: '40px', letterSpacing: '0.08em' }}>
          <Zap size={12} color="var(--color-accent)" /> RETRIEVAL-AUGMENTED GENERATION v3.0
        </div>
        
        <h1 className="heading-elite animate-elite" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', marginBottom: '32px' }}>
          Transform static manuals<br/>
          <span style={{ color: 'var(--color-text-muted)' }}>into interactive intelligence.</span>
        </h1>
        
        <p className="animate-elite" style={{ fontSize: '1.15rem', color: 'var(--color-text-dim)', maxWidth: '680px', margin: '0 auto 64px', lineHeight: 1.6, animationDelay: '0.1s' }}>
          ApplianceIQ leverages Pinecone vector search and LLMs to bridge the gap between physical hardware and digital support. Upload PDFs, generate QR codes, and chat with your manuals.
        </p>

        <div className="animate-elite" style={{ display: 'flex', justifyContent: 'center', gap: '16px', animationDelay: '0.2s' }}>
          <Link to="/signup" className="btn-elite" style={{ padding: '16px 40px' }}>Get Started <ArrowRight size={16} /></Link>
          <a href="#features" className="btn-elite-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Explore Features</a>
        </div>

        {/* ── REAL FEATURE SHOWCASE ── */}
        <div className="animate-elite" style={{ marginTop: '100px', animationDelay: '0.3s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: 'rgba(255,255,255,0.1)', border: 'var(--border-thin)', borderRadius: '12px', overflow: 'hidden' }}>
            {[
              { 
                icon: <FileText size={24} />, 
                title: 'Smart Ingestion', 
                desc: 'Upload PDFs or images (JPG/PNG). Our OCR system extracts, chunks, and indexes content for instant retrieval.' 
              },
              { 
                icon: <QrCode size={24} />, 
                title: 'QR Integration', 
                desc: 'Generate unique QR stickers for physical appliances. Customers scan to access the manual chat instantly.' 
              },
              { 
                icon: <MessageSquare size={24} />, 
                title: 'RAG Chatbot', 
                desc: 'Natural language interface grounded in actual manual content. No hallucinations, just facts.' 
              }
            ].map((f, i) => (
              <div key={i} style={{ background: 'var(--color-bg-elevated)', padding: '48px 32px', textAlign: 'left' }}>
                <div style={{ color: 'white', marginBottom: '24px' }}>{f.icon}</div>
                <h3 className="heading-elite" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>{f.title}</h3>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Technical Features ── */}
      <section id="features" style={{ padding: '100px 40px', maxWidth: '1400px', margin: '0 auto', borderTop: 'var(--border-thin)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.75rem', marginBottom: '16px', letterSpacing: '0.1em' }}>ARCHITECTURE</div>
            <h2 className="heading-elite" style={{ fontSize: '2.5rem', marginBottom: '24px' }}>Built on a modern <br/>RAG Stack.</h2>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
              We've engineered a unified ML service that handles everything from PDF parsing to Pinecone vector upserts, ensuring your manuals are always ready for context-aware queries.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {[
                { title: 'Vector Store', value: 'Pinecone' },
                { title: 'Processing', value: 'FastAPI' },
                { title: 'Intelligence', value: 'Llama-3 / Gemini' },
                { title: 'Persistence', value: 'MongoDB' }
              ].map((item, i) => (
                <div key={i} style={{ borderBottom: 'var(--border-thin)', paddingBottom: '12px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{item.title}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="elite-panel" style={{ padding: '40px', background: 'rgba(255,255,255,0.01)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', border: 'var(--border-thin)', borderRadius: '8px', background: '#0B0F1A' }}>
                  <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 800, marginBottom: '8px' }}>USER_QUERY_RECEIVED</div>
                  <div style={{ fontSize: '0.9rem', color: 'white', fontFamily: 'monospace' }}>"How do I clean the lint filter?"</div>
                </div>
                <div style={{ padding: '16px', border: 'var(--border-thin)', borderRadius: '8px', background: '#0B0F1A', marginLeft: '20px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: 800, marginBottom: '8px' }}>RETRIEVING_CONTEXT_PINECONE</div>
                  <div style={{ height: '4px', width: '60%', background: '#1F2937', borderRadius: '2px' }} />
                </div>
                <div style={{ padding: '16px', border: 'var(--border-thin)', borderRadius: '8px', background: '#0B0F1A' }}>
                  <div style={{ fontSize: '0.7rem', color: 'white', fontWeight: 800, marginBottom: '8px' }}>AI_RESPONSE_GENERATED</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>"According to page 12 of the manual, pull the filter upward and rinse with warm water..."</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '80px 40px', borderTop: 'var(--border-thin)', textAlign: 'center', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <div className="heading-elite" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>ApplianceIQ</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Engineered by Tirth J Dalal</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
          {['GitHub', 'Email', 'Portfolio'].map(item => (
            <a key={item} href="#" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>{item}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
