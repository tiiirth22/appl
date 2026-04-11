import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Scan, MessageSquare, ArrowRight, BookOpen, Shield, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="iq-landing" id="landing-page">

      {/* ── Navigation ── */}
      <nav className="iq-landing-nav" id="landing-nav">
        <div className="iq-landing-nav-inner">
          <Link to="/" className="iq-l-brand" style={{ textDecoration: 'none' }}>
            <div className="iq-l-brand-icon"><Cpu size={18} /></div>
            <span>ApplianceIQ</span>
          </Link>
          <div className="iq-l-nav-actions">
            <Link to="/login" className="iq-l-link" id="nav-signin">Sign In</Link>
            <Link to="/signup" className="iq-l-btn-cta" id="nav-get-started">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="iq-hero" id="hero-section">
        <div className="iq-hero-glow" />
        <div className="iq-hero-inner">
          <div className="iq-hero-content">
            <div className="iq-hero-badge" id="hero-badge">
              <span className="iq-badge-dot" />
              <span>Powered by Llama 3.1 RAG Engine</span>
              <ArrowRight size={12} />
            </div>

            <h1 className="iq-hero-h1" id="hero-headline">
              Transform Manuals into{' '}
              <span className="iq-gradient-text">AI Knowledge</span>
            </h1>

            <p className="iq-hero-subtitle" id="hero-subtitle">
              Upload appliance manuals once. Get instant AI-powered support for your customers —
              with vector search, QR deployment, and real-time analytics.
            </p>

            <div className="iq-hero-actions">
              <Link to="/signup" className="iq-btn-primary-lg" id="hero-cta-primary">
                Start Free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="iq-btn-secondary-lg" id="hero-cta-secondary">
                View Dashboard
              </Link>
            </div>

            <div className="iq-hero-stats" id="hero-stats">
              <div className="iq-hero-stat">
                <span className="iq-stat-num">500+</span>
                <span className="iq-stat-label">Manuals Indexed</span>
              </div>
              <div className="iq-stat-divider" />
              <div className="iq-hero-stat">
                <span className="iq-stat-num">&lt;200ms</span>
                <span className="iq-stat-label">Avg. Retrieval</span>
              </div>
              <div className="iq-stat-divider" />
              <div className="iq-hero-stat">
                <span className="iq-stat-num">99.9%</span>
                <span className="iq-stat-label">Uptime SLA</span>
              </div>
            </div>
          </div>

          <div className="iq-hero-visual">
            <div className="iq-dash-preview">
              <div className="iq-preview-topbar">
                <div className="iq-preview-dots">
                  <span /><span /><span />
                </div>
                <div className="iq-preview-url">applianceiq.app/dashboard</div>
              </div>
              <div className="iq-preview-body">
                <div className="iq-preview-header-row">
                  <div className="iq-ph-title" />
                  <div className="iq-ph-btn" />
                </div>
                <div className="iq-preview-cards">
                  <div className="iq-ph-card">
                    <div className="iq-ph-icon blue" />
                    <div className="iq-ph-lines">
                      <div className="iq-ph-line w60" />
                      <div className="iq-ph-line w40" />
                    </div>
                  </div>
                  <div className="iq-ph-card">
                    <div className="iq-ph-icon green" />
                    <div className="iq-ph-lines">
                      <div className="iq-ph-line w60" />
                      <div className="iq-ph-line w40" />
                    </div>
                  </div>
                  <div className="iq-ph-card">
                    <div className="iq-ph-icon purple" />
                    <div className="iq-ph-lines">
                      <div className="iq-ph-line w60" />
                      <div className="iq-ph-line w40" />
                    </div>
                  </div>
                </div>
                <div className="iq-preview-table">
                  <div className="iq-ph-row" />
                  <div className="iq-ph-row" />
                  <div className="iq-ph-row" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="iq-features" id="features-section">
        <div className="iq-features-inner">
          <div className="iq-section-header">
            <h2 className="iq-section-h2" id="features-heading">The Infrastructure for Smart Manuals</h2>
            <p className="iq-section-sub">Everything you need to deploy enterprise-grade AI assistants for your physical products.</p>
          </div>

          <div className="iq-features-grid">
            {[
              { icon: <Cpu size={22} />, color: 'blue', title: 'Neural Ingestion', desc: 'Advanced OCR and PDF parsing that understands complex technical diagrams, tables, and specifications.' },
              { icon: <Zap size={22} />, color: 'emerald', title: 'Vector Precision', desc: 'Instant vector indexing ensures sub-millisecond retrieval of the most relevant manual sections.' },
              { icon: <Scan size={22} />, color: 'violet', title: 'QR Deployments', desc: 'Generate secure QR codes that provide instant access to AI-powered product support on any device.' },
              { icon: <MessageSquare size={22} />, color: 'amber', title: 'Llama 3.1 Intelligence', desc: 'Powered by Llama 3.1 for nuanced, accurate, and safety-aligned product support conversations.' },
              { icon: <Shield size={22} />, color: 'cyan', title: 'Enterprise Security', desc: 'Role-based access control, encrypted storage, and signed deployments protect your proprietary data.' },
              { icon: <BarChart3 size={22} />, color: 'rose', title: 'Real-time Analytics', desc: 'Track query patterns, user sentiment, and retrieval performance with actionable intelligence reports.' },
            ].map((f, i) => (
              <div className="iq-feature-card" key={i} id={`feature-${i}`}>
                <div className={`iq-feature-icon ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="iq-feature-title">{f.title}</h3>
                <p className="iq-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="iq-how" id="how-it-works">
        <div className="iq-how-inner">
          <div className="iq-section-header">
            <h2 className="iq-section-h2">Three Steps to AI-Powered Support</h2>
            <p className="iq-section-sub">From PDF to production in under a minute.</p>
          </div>

          <div className="iq-steps">
            {[
              { step: '01', title: 'Upload Manual', desc: 'Drag and drop your PDF. Our OCR engine extracts every detail.' },
              { step: '02', title: 'AI Indexes Knowledge', desc: 'Vector embeddings are built automatically for instant retrieval.' },
              { step: '03', title: 'Deploy & Monitor', desc: 'Get a QR code, embed the chatbot, and track analytics live.' },
            ].map((s, i) => (
              <div className="iq-step-card" key={i}>
                <div className="iq-step-num">{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < 2 && <div className="iq-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="iq-cta" id="cta-section">
        <div className="iq-cta-inner">
          <div className="iq-cta-card">
            <div className="iq-cta-glow" />
            <h2>Ready to modernize your support?</h2>
            <p>Join the future of product documentation. Start free, scale as you grow.</p>
            <div className="iq-cta-actions">
              <Link to="/signup" className="iq-btn-primary-lg" id="cta-create-account">Create Account</Link>
              <Link to="/login" className="iq-btn-secondary-lg" id="cta-sign-in">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="iq-footer" id="landing-footer">
        <div className="iq-footer-inner">
          <span>© 2026 ApplianceIQ. Built for modern hardware.</span>
          <div className="iq-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Security</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .iq-landing {
          min-height: 100vh;
          background: #0B0F1A;
          color: #F9FAFB;
          font-family: 'Inter', system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .iq-landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(11, 15, 26, 0.8);
          backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .iq-landing-nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .iq-l-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #F9FAFB;
          font-weight: 800;
          font-size: 1.0625rem;
          letter-spacing: -0.03em;
        }
        .iq-l-brand-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        .iq-l-nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .iq-l-link {
          color: #9CA3AF;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.8125rem;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 200ms;
        }
        .iq-l-link:hover { color: #F9FAFB; background: rgba(255,255,255,0.04); }
        .iq-l-btn-cta {
          background: #F9FAFB;
          color: #0B0F1A;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8125rem;
          text-decoration: none;
          transition: all 200ms;
        }
        .iq-l-btn-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
        }

        /* ── Hero ── */
        .iq-hero {
          position: relative;
          padding-top: 64px;
        }
        .iq-hero-glow {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .iq-hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 32px 64px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .iq-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.15);
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #93C5FD;
          margin-bottom: 32px;
        }
        .iq-badge-dot {
          width: 6px;
          height: 6px;
          background: #3B82F6;
          border-radius: 50%;
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          50% { box-shadow: 0 0 8px 3px rgba(59, 130, 246, 0.4); }
        }
        .iq-hero-h1 {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
        }
        .iq-gradient-text {
          background: linear-gradient(135deg, #3B82F6, #818CF8, #60A5FA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .iq-hero-subtitle {
          font-size: 1.125rem;
          line-height: 1.7;
          color: #9CA3AF;
          margin-bottom: 40px;
          max-width: 520px;
        }
        .iq-hero-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 48px;
        }
        .iq-btn-primary-lg {
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          color: white;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9375rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 200ms;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
        }
        .iq-btn-primary-lg:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }
        .iq-btn-secondary-lg {
          background: #1F2937;
          color: #F9FAFB;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9375rem;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 200ms;
        }
        .iq-btn-secondary-lg:hover {
          background: #263244;
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* Stats */
        .iq-hero-stats {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .iq-hero-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .iq-stat-num {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #F9FAFB;
        }
        .iq-stat-label {
          font-size: 0.75rem;
          color: #6B7280;
          font-weight: 500;
        }
        .iq-stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.08);
        }

        /* Dashboard Preview */
        .iq-hero-visual {
          perspective: 1200px;
        }
        .iq-dash-preview {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          transform: rotateY(-5deg) rotateX(2deg);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.05);
          transition: transform 400ms ease;
        }
        .iq-dash-preview:hover {
          transform: rotateY(-2deg) rotateX(1deg);
        }
        .iq-preview-topbar {
          background: rgba(255, 255, 255, 0.03);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .iq-preview-dots {
          display: flex;
          gap: 6px;
        }
        .iq-preview-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }
        .iq-preview-dots span:first-child { background: rgba(239, 68, 68, 0.4); }
        .iq-preview-dots span:nth-child(2) { background: rgba(245, 158, 11, 0.4); }
        .iq-preview-dots span:nth-child(3) { background: rgba(16, 185, 129, 0.4); }
        .iq-preview-url {
          flex: 1;
          text-align: center;
          font-size: 0.6875rem;
          color: #4B5563;
          font-family: 'JetBrains Mono', monospace;
        }
        .iq-preview-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .iq-preview-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .iq-ph-title {
          width: 160px;
          height: 14px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
        }
        .iq-ph-btn {
          width: 80px;
          height: 28px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 6px;
        }
        .iq-preview-cards {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        .iq-ph-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .iq-ph-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
        }
        .iq-ph-icon.blue { background: rgba(59, 130, 246, 0.15); }
        .iq-ph-icon.green { background: rgba(16, 185, 129, 0.15); }
        .iq-ph-icon.purple { background: rgba(139, 92, 246, 0.15); }
        .iq-ph-lines { display: flex; flex-direction: column; gap: 6px; }
        .iq-ph-line {
          height: 8px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 4px;
        }
        .iq-ph-line.w60 { width: 60%; }
        .iq-ph-line.w40 { width: 40%; }
        .iq-preview-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .iq-ph-row {
          height: 32px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        /* ── Features ── */
        .iq-features {
          padding: 120px 0;
        }
        .iq-features-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .iq-section-header {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 64px;
        }
        .iq-section-h2 {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        .iq-section-sub {
          font-size: 1.0625rem;
          color: #6B7280;
          line-height: 1.6;
        }
        .iq-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .iq-feature-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
          transition: all 250ms ease-in-out;
        }
        .iq-feature-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }
        .iq-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .iq-feature-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
        .iq-feature-icon.emerald { background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .iq-feature-icon.violet { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; }
        .iq-feature-icon.amber { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
        .iq-feature-icon.cyan { background: rgba(6, 182, 212, 0.1); color: #06B6D4; }
        .iq-feature-icon.rose { background: rgba(244, 63, 94, 0.1); color: #F43F5E; }
        .iq-feature-title {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }
        .iq-feature-desc {
          font-size: 0.875rem;
          line-height: 1.65;
          color: #6B7280;
        }

        /* ── How It Works ── */
        .iq-how {
          padding: 80px 0 120px;
        }
        .iq-how-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .iq-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          position: relative;
        }
        .iq-step-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
          position: relative;
          transition: all 250ms;
        }
        .iq-step-card:hover {
          border-color: rgba(59, 130, 246, 0.2);
        }
        .iq-step-num {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
          line-height: 1;
        }
        .iq-step-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .iq-step-card p {
          font-size: 0.875rem;
          color: #6B7280;
          line-height: 1.6;
        }
        .iq-step-connector {
          display: none;
        }

        /* ── CTA ── */
        .iq-cta {
          padding: 0 0 80px;
        }
        .iq-cta-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .iq-cta-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 80px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .iq-cta-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(59, 130, 246, 0.1), transparent 70%);
          pointer-events: none;
        }
        .iq-cta-card h2 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 16px;
          position: relative;
        }
        .iq-cta-card p {
          font-size: 1.125rem;
          color: #6B7280;
          margin-bottom: 40px;
          position: relative;
        }
        .iq-cta-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          position: relative;
        }

        /* ── Footer ── */
        .iq-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 32px 0;
        }
        .iq-footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
          color: #4B5563;
        }
        .iq-footer-links {
          display: flex;
          gap: 24px;
        }
        .iq-footer-links a {
          color: #4B5563;
          text-decoration: none;
          transition: color 200ms;
        }
        .iq-footer-links a:hover { color: #9CA3AF; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .iq-hero-inner { grid-template-columns: 1fr; text-align: center; }
          .iq-hero-subtitle { margin-left: auto; margin-right: auto; }
          .iq-hero-actions { justify-content: center; }
          .iq-hero-stats { justify-content: center; }
          .iq-hero-visual { display: none; }
          .iq-features-grid { grid-template-columns: repeat(2, 1fr); }
          .iq-steps { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
        }
        @media (max-width: 640px) {
          .iq-hero-h1 { font-size: 2.25rem; }
          .iq-hero-subtitle { font-size: 1rem; }
          .iq-features-grid { grid-template-columns: 1fr; }
          .iq-section-h2 { font-size: 1.75rem; }
          .iq-cta-card { padding: 48px 24px; }
          .iq-cta-card h2 { font-size: 1.75rem; }
          .iq-cta-actions { flex-direction: column; align-items: center; }
          .iq-hero-actions { flex-direction: column; align-items: center; }
          .iq-hero-stats { flex-direction: column; gap: 16px; }
          .iq-stat-divider { width: 40px; height: 1px; }
          .iq-l-nav-actions .iq-l-link { display: none; }
        }
      `}</style>
    </div>
  );
}
