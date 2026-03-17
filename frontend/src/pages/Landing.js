import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Scan, MessageSquare, Shield, Zap, Globe, LogIn, UserPlus, ArrowRight, Star, Cpu, Heart } from 'lucide-react';
import { MorphingButton } from '../components/ui/morphing-button';

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Dynamic Background Elements */}

      {/* Main Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="nav-minimal">
            <div className="brand">
              <Star className="brand-star" size={20} fill="currentColor" />
              <span>ApplianceIQ</span>
            </div>
            <div className="nav-actions">
              <Link to="/login" className="nav-text-link">Sign In</Link>
              <Link to="/signup" className="btn-modern-sm">Get Started</Link>
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-announcement">
              <span className="badge-new">NEW</span>
              <span className="announcement-text">Llama 3.1 RAG Engine now live</span>
              <ArrowRight size={14} />
            </div>

            <h1 className="hero-h1">
              Elevate your <span className="gradient-text">Product Knowledge</span> with AI
            </h1>

            <p className="hero-p">
              Transform static manuals into interactive AI-powered assistants.
              Secure ingestion, instant vector indexing, and professional QR deployments in seconds.
            </p>

            <div className="hero-interaction">
              <Link to="/signup" className="no-underline">
                <MorphingButton
                  buttonText="Get Started Free"
                  className="hero-morph"
                  onSubmit={() => { window.location.href = '/signup' }}
                />
              </Link>
              <div className="social-proof">
                <div className="avatar-group">
                  <img src="https://i.pravatar.cc/100?u=1" alt="u1" />
                  <img src="https://i.pravatar.cc/100?u=2" alt="u2" />
                  <img src="https://i.pravatar.cc/100?u=3" alt="u3" />
                </div>
                <span>Trusted by 500+ business owners</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase */}
      <section className="features-section">
        <div className="section-head">
          <h2 className="section-h2">The Infrastructure for Smart Manuals</h2>
          <p className="section-p">Everything you need to deploy enterprise-grade AI assistants for your physical products.</p>
        </div>

        <div className="feature-grid-modern">
          <div className="feature-item">
            <div className="icon-wrap blue">
              <Cpu size={24} />
            </div>
            <h3>Neural Ingestion</h3>
            <p>Advanced OCR and PDF parsing technology that understands complex technical diagrams and tables.</p>
          </div>

          <div className="feature-item">
            <div className="icon-wrap green">
              <Zap size={24} />
            </div>
            <h3>Vector Precision</h3>
            <p>Instant Pinecone indexing ensures sub-millisecond retrieval of the most relevant manual sections.</p>
          </div>

          <div className="feature-item">
            <div className="icon-wrap purple">
              <Scan size={24} />
            </div>
            <h3>Signed Deployments</h3>
            <p>Generate cryptographic QR codes that prevent unauthorized scraping while offering instant access.</p>
          </div>

          <div className="feature-item">
            <div className="icon-wrap orange">
              <MessageSquare size={24} />
            </div>
            <h3>Llama 3.1 Intelligence</h3>
            <p>Powered by Llama 3.1 70B for nuanced, accurate, and safety-aligned product support conversations.</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="final-cta">
        <div className="cta-glass">
          <h2 className="cta-h2">Ready to modernize your support?</h2>
          <p className="cta-p">Join the future of product documentation today.</p>
          <div className="cta-btns">
            <Link to="/signup" className="btn-modern-lg primary">Create Account</Link>
            <Link to="/login" className="btn-modern-lg secondary">System Status</Link>
          </div>
        </div>
        <footer className="landing-footer">
          <div className="footer-line"></div>
          <div className="footer-content">
            <span>© 2026 ApplianceIQ. Built for modern hardware.</span>
            <div className="footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </footer>
      </section>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: #09090b;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        .bottom-right {
          background: #10b981;
          bottom: -200px;
          right: -200px;
        }

        .hero-section {
          position: relative;
          z-index: 1;
        }

        .hero-overlay {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .nav-minimal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.05em;
        }

        .brand-star {
          color: #3b82f6;
          filter: drop-shadow(0 0 8px #3b82f6);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-text-link {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .nav-text-link:hover {
          color: white;
        }

        .btn-modern-sm {
          background: white;
          color: black;
          padding: 0.625rem 1.25rem;
          border-radius: 2rem;
          font-weight: 700;
          font-size: 0.875rem;
          text-decoration: none;
          transition: 0.2s;
        }

        .btn-modern-sm:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(255,255,255,0.2);
        }

        .hero-content {
          margin: 6rem auto 4rem;
          max-width: 900px;
          text-align: center;
        }

        .hero-announcement {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.5rem 1rem 0.5rem 0.5rem;
          border-radius: 2rem;
          margin-bottom: 3rem;
          font-size: 0.8125rem;
          color: #94a3b8;
          transition: 0.3s;
          cursor: pointer;
        }

        .hero-announcement:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .badge-new {
          background: #3b82f6;
          color: white;
          font-weight: 900;
          padding: 0.25rem 0.625rem;
          border-radius: 1rem;
          font-size: 0.65rem;
        }

        .hero-h1 {
          font-size: 4.5rem;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.06em;
          margin-bottom: 2rem;
        }

        .gradient-text {
          color: #3b82f6;
        }

        .hero-p {
          font-size: 1.25rem;
          line-height: 1.6;
          color: #94a3b8;
          max-width: 700px;
          margin: 0 auto 3.5rem;
        }

        .hero-interaction {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
        }

        .no-underline {
            text-decoration: none;
        }

        .social-proof {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .avatar-group {
          display: flex;
          align-items: center;
        }

        .avatar-group img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #020617;
          margin-left: -12px;
        }

        .avatar-group img:first-child {
          margin-left: 0;
        }

        .hero-visual {
            margin-top: 4rem;
            perspective: 1000px;
        }

        .visual-card {
            max-width: 800px;
            margin: 0 auto;
            background: #0f172a;
            border-radius: 1rem 1rem 0 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-bottom: none;
            overflow: hidden;
            transform: rotateX(5deg);
            box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
        }

        .card-top {
            background: rgba(255, 255, 255, 0.05);
            padding: 0.75rem 1.25rem;
            display: flex;
            align-items: center;
            gap: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .dots { display: flex; gap: 0.5rem; }
        .dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); }

        .url-bar {
            background: rgba(0, 0, 0, 0.2);
            padding: 0.25rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            color: #475569;
            flex: 1;
            text-align: center;
            font-family: monospace;
        }

        .card-body-mock {
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .skeleton { background: rgba(255, 255, 255, 0.03); border-radius: 0.5rem; }
        .mock-item { height: 2rem; width: 100%; }
        .mock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .mock-item.small { height: 6rem; }
        .mock-item.larger { height: 10rem; }

        /* Features */
        .features-section {
            padding: 10rem 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .section-head {
            text-align: center;
            max-width: 700px;
            margin: 0 auto 6rem;
        }

        .section-h2 {
            font-size: 3rem;
            font-weight: 900;
            letter-spacing: -0.05em;
            margin-bottom: 1.5rem;
        }

        .section-p {
            font-size: 1.125rem;
            color: #64748b;
            line-height: 1.6;
        }

        .feature-grid-modern {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 3rem;
        }

        .feature-item {
            padding: 2.5rem;
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 2rem;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-item:hover {
            background: rgba(255, 255, 255, 0.03);
            border-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-8px);
        }

        .icon-wrap {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
        }

        .icon-wrap.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .icon-wrap.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .icon-wrap.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
        .icon-wrap.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }

        .feature-item h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .feature-item p {
            font-size: 0.9375rem;
            line-height: 1.6;
            color: #64748b;
        }

        /* Final CTA */
        .final-cta {
            padding: 6rem 2rem 4rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .cta-glass {
            background: #101010;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 3rem;
            padding: 6rem 4rem;
            text-align: center;
            margin-bottom: 6rem;
            position: relative;
            overflow: hidden;
        }

        .cta-h2 {
            font-size: 3.5rem;
            font-weight: 900;
            letter-spacing: -0.06em;
            margin-bottom: 1.5rem;
        }

        .cta-p {
            font-size: 1.25rem;
            color: #94a3b8;
            margin-bottom: 3rem;
        }

        .cta-btns {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
        }

        .btn-modern-lg {
            padding: 1.25rem 3rem;
            border-radius: 3rem;
            font-weight: 800;
            text-decoration: none;
            transition: 0.3s;
        }

        .btn-modern-lg.primary {
            background: #3b82f6;
            color: white;
            box-shadow: 0 15px 30px rgba(59, 130, 246, 0.3);
        }

        .btn-modern-lg.primary:hover {
            background: #2563eb;
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
        }

        .btn-modern-lg.secondary {
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-modern-lg.secondary:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .landing-footer {
            opacity: 0.5;
        }

        .footer-line {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
            margin-bottom: 2.5rem;
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8125rem;
        }

        .footer-links {
            display: flex;
            gap: 2rem;
        }

        .footer-links a {
            color: white;
            text-decoration: none;
        }

        @media (max-width: 768px) {
            .hero-h1 { font-size: 2.75rem; }
            .hero-p { font-size: 1.125rem; }
            .cta-h2 { font-size: 2.25rem; }
            .cta-btns { flex-direction: column; }
            .nav-actions { display: none; }
        }
      `}</style>
    </div>
  );
}
