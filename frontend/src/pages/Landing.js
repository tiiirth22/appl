import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Scan, MessageSquare, Shield, Zap, Globe, LogIn, UserPlus } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing" data-testid="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Production-Ready RAG Platform</div>
          <h1 className="hero-title" data-testid="hero-title">
            ApplianceIQ
          </h1>
          <p className="hero-subtitle">
            Empower Your Customers with Instant Answers from Appliance Manuals
          </p>
          <p className="hero-description">
            A B2B SaaS platform that transforms static manuals into interactive, AI-powered chatbots.
            Just scan a QR code and get instant answers.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary btn-large" data-testid="signup-btn">
              <UserPlus size={20} />
              Sign Up Free
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large" data-testid="login-btn">
              <LogIn size={20} />
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose ApplianceIQ?</h2>
          <div className="features-grid">
            <div className="feature-card" data-testid="feature-upload">
              <div className="feature-icon">
                <BookOpen size={32} />
              </div>
              <h3>Easy Manual Upload</h3>
              <p>Upload PDFs or images of appliance manuals. Our OCR and AI extract text automatically.</p>
            </div>

            <div className="feature-card" data-testid="feature-qr">
              <div className="feature-icon">
                <Scan size={32} />
              </div>
              <h3>Smart QR Codes</h3>
              <p>Generate secure, signed QR codes for each appliance. Customers scan and access the chatbot instantly.</p>
            </div>

            <div className="feature-card" data-testid="feature-rag">
              <div className="feature-icon">
                <MessageSquare size={32} />
              </div>
              <h3>RAG-Powered Chatbot</h3>
              <p>Llama 3.1 + Qdrant vector search ensures accurate answers grounded in your manuals.</p>
            </div>

            <div className="feature-card" data-testid="feature-security">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>Enterprise Security</h3>
              <p>HMAC-signed QR codes, secure authentication, and encrypted data storage.</p>
            </div>

            <div className="feature-card" data-testid="feature-analytics">
              <div className="feature-icon">
                <Globe size={32} />
              </div>
              <h3>Analytics Dashboard</h3>
              <p>Track queries, monitor feedback, and understand customer needs better.</p>
            </div>

            <div className="feature-card" data-testid="feature-pwa">
              <div className="feature-icon">
                <Zap size={32} />
              </div>
              <h3>PWA Ready</h3>
              <p>Works offline, installable, and provides app-like experience on any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Manuals?</h2>
          <p>Join manufacturers worldwide using ApplianceIQ to enhance customer experience</p>
          <Link to="/signup" className="btn btn-primary btn-large" data-testid="cta-btn">
            Start Free Trial
          </Link>
        </div>
      </section>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: #fdfdfd;
          color: #1a202c;
        }

        .hero {
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          position: relative;
          background: #ffffff;
        }

        .hero-content {
          max-width: 800px;
          z-index: 1;
        }

        .hero-badge {
          display: inline-block;
          background: #f1f5f9;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          color: #2563eb;
          font-weight: 700;
          margin-bottom: 2rem;
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 1.5rem;
          line-height: 1;
          letter-spacing: -0.025em;
        }

        .hero-subtitle {
          font-size: 1.75rem;
          color: #334155;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .hero-description {
          font-size: 1.125rem;
          color: #64748b;
          margin-bottom: 3rem;
          line-height: 1.7;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-large {
          padding: 1rem 3rem;
          font-size: 1.125rem;
        }

        .features {
          background: white;
          padding: 5rem 2rem;
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 3rem;
          color: #2d3748;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s;
        }

        .feature-card:hover {
          border-color: #667eea;
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: #eff6ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #2d3748;
        }

        .feature-card p {
          color: #718096;
          line-height: 1.6;
        }

        .cta-section {
          background: #0f172a;
          padding: 6rem 2rem;
          text-align: center;
          color: white;
        }

        .cta-content {
          max-width: 700px;
          margin: 0 auto;
        }

        .cta-section h2 {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1.5rem;
          letter-spacing: -0.025em;
        }

        .cta-section p {
          font-size: 1.125rem;
          color: #94a3b8;
          margin-bottom: 3rem;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.25rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
