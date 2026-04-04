import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, LogOut, FileText, Loader, Check, ArrowRight, Shield, Globe, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingInput } from '../components/ui/floating-input';
import { BiSolidZap } from 'react-icons/bi';
import Navbar from '../components/ui/Navbar';

import { API_BASE_URL as API } from '../config';

export default function ManualUpload({ user, onLogout }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    model_name: '',
    version: '',
    region: 'global'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrData, setQrData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    const formPayload = new FormData();
    formPayload.append('file', file);
    formPayload.append('model_name', formData.model_name);
    formPayload.append('version', formData.version);
    formPayload.append('region', formData.region);

    try {
      const response = await axios.post(`${API}/manuals/upload`, formPayload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setQrData(response.data.qr_code);

      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.detail || 'Failed to upload manual');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <Navbar user={user} onLogout={onLogout} activePage="upload" />

      <div className="main-content">
        <AnimatePresence mode="wait">
        <div className="upload-container">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="success-card"
            >
              <div className="success-header">
                <div className="confetti-icon">
                  <Check size={40} />
                </div>
                <h2>Success! Ingestion Complete</h2>
                <p>Your manual is being indexed and the QR code is ready.</p>
              </div>

              {qrData && (
                <div className="qr-result-area">
                  <div className="qr-box">
                    <img src={qrData.image} alt="QR Code" />
                    <div className="qr-badge">SCAN ME</div>
                  </div>
                  <div className="qr-meta">
                    <div className="meta-row">
                      <span className="label text-muted">Model</span>
                      <span className="value">{formData.model_name}</span>
                    </div>
                    <div className="meta-row">
                      <span className="label text-muted">Short URL</span>
                      <span className="value link">{qrData.url}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="completion-footer">
                <p>Redirecting to your dashboard in a few seconds...</p>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill"></div>
                </div>
                <Link to="/dashboard" className="btn btn-secondary mt-4">
                  Go Now <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="upload-glass-card"
            >
              <div className="form-sidebar">
                <div className="sidebar-content">
                  <div className="step-indicator">
                    <div className="step active">
                      <motion.div 
                        animate={{ boxShadow: ["0 0 0px rgba(59,130,246,0)", "0 0 20px rgba(59,130,246,0.5)", "0 0 0px rgba(59,130,246,0)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="step-number"
                      >1</motion.div>
                      <div className="step-text">Metadata</div>
                    </div>
                    <div className={`step ${file ? 'active' : ''}`}>
                      {file ? (
                        <motion.div 
                          animate={{ boxShadow: ["0 0 0px rgba(59,130,246,0)", "0 0 20px rgba(59,130,246,0.5)", "0 0 0px rgba(59,130,246,0)"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="step-number"
                        >2</motion.div>
                      ) : (
                        <div className="step-number">2</div>
                      )}
                      <div className="step-text">File Assets</div>
                    </div>
                    <div className={`step ${uploading ? 'active' : ''}`}>
                      {uploading ? (
                        <motion.div 
                          animate={{ boxShadow: ["0 0 0px rgba(59,130,246,0)", "0 0 20px rgba(59,130,246,0.5)", "0 0 0px rgba(59,130,246,0)"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="step-number"
                        >3</motion.div>
                      ) : (
                        <div className="step-number">3</div>
                      )}
                      <div className="step-text">AI Indexing</div>
                    </div>
                  </div>

                  <div className="upload-tips">
                    <h3><Info size={16} /> Pro Tips</h3>
                    <ul>
                      <li>Upload clear high-res PDFs for better OCR.</li>
                      <li>Include regional versions for localized info.</li>
                      <li>Index time: ~30s per 100 pages.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="form-main">
                <div className="form-header">
                  <h1>Upload New Manual</h1>
                  <p>Train your AI custom assistant with specialized product knowledge.</p>
                </div>

                <form onSubmit={handleSubmit} className="modern-form">
                  <div className="form-row">
                    <FloatingInput
                      label="Appliance Model Name"
                      placeholder="e.g. Samsung Jet 75 Pet"
                      value={formData.model_name}
                      onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                      required
                      className="flex-1"
                    />
                  </div>

                  <div className="form-grid">
                    <div className="input-group">
                      <label>Version</label>
                      <div className="input-with-icon">
                        <Shield size={16} className="input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. v2.4"
                          value={formData.version}
                          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Region</label>
                      <div className="input-with-icon">
                        <Globe size={16} className="input-icon" />
                        <select
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        >
                          <option value="global">Global (Universal)</option>
                          <option value="us">North America (US/CA)</option>
                          <option value="eu">Europe (EMEA)</option>
                          <option value="asia">Asia Pacific (APAC)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={`dropzone ${file ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      id="file-assets"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files[0])}
                      required
                    />
                    <label htmlFor="file-assets">
                      <div className="dropzone-icon">
                        {file ? <FileText size={32} /> : <Upload size={32} />}
                      </div>
                      <div className="dropzone-text">
                        <span className="primary">{file ? file.name : 'Drop manual file here'}</span>
                        <span className="secondary">PDF, PNG or JPEG (max 25MB)</span>
                      </div>
                      {file && <div className="file-ready-tag">READY</div>}
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-transparent bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 [background-size:200%_auto] [background-position:0%_center] text-white font-bold transition-[background-position] duration-500 ease-out hover:bg-transparent hover:[background-position:100%_center] focus-visible:ring-sky-600/20 dark:from-sky-400 dark:via-sky-300 dark:to-sky-400 dark:focus-visible:ring-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Index Manual <BiSolidZap size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </div>
        </AnimatePresence>
      </div>

      <style jsx>{`
        .upload-page {
          min-height: 100vh;
          background: #020617;
          background-image: 
            radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
          color: #f8fafc;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .upload-page::before {
            content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 70%);
            animation: aurora 20s infinite linear; z-index: 0; pointer-events: none;
        }

        @keyframes aurora { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem;
        }

        .upload-glass-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(20px);
          border-radius: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: grid;
          grid-template-columns: 280px 1fr;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .form-sidebar {
          background: rgba(15, 23, 42, 0.4);
          padding: 3rem 2rem;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }

        .step-indicator {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          opacity: 0.4;
          transition: all 0.3s;
        }

        .step.active {
          opacity: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.875rem;
        }

        .step.active .step-number {
          background: #3b82f6;
          border-color: #60a5fa;
          color: white;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
        }

        .step-text {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .upload-tips {
          margin-top: 6rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 1.5rem;
          border-radius: 1.25rem;
        }

        .upload-tips h3 {
          font-size: 0.8125rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #60a5fa;
        }

        .upload-tips ul {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .upload-tips li {
          font-size: 0.75rem;
          line-height: 1.5;
          color: #94a3b8;
          padding-left: 1.25rem;
          position: relative;
        }

        .upload-tips li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #3b82f6;
        }

        .form-main {
          padding: 4rem;
        }

        .form-header {
          margin-bottom: 3.5rem;
        }

        .form-header h1 {
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          margin: 0;
        }

        .form-header p {
          color: #94a3b8;
          margin-top: 0.75rem;
          font-size: 1.125rem;
        }

        .modern-form {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .input-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          margin-bottom: 0.75rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          color: #475569;
        }

        .input-with-icon input, .input-with-icon select {
          width: 100%;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1rem 1.25rem 1rem 3.25rem;
          border-radius: 1rem;
          color: white;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .input-with-icon input:focus, .input-with-icon select:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(15, 23, 42, 0.6);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .dropzone {
          position: relative;
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          padding: 3rem;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255, 255, 255, 0.02);
        }

        .dropzone:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
          transform: translateY(-2px);
        }

        .dropzone.has-file {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
          border-style: solid;
        }

        .dropzone input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .dropzone-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: #94a3b8;
          transition: all 0.3s;
        }

        .dropzone:hover .dropzone-icon {
          color: #3b82f6;
          transform: scale(1.1) rotate(5deg);
        }

        .dropzone-text {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dropzone-text .primary {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .dropzone-text .secondary {
          font-size: 0.875rem;
          color: #64748b;
        }

        .file-ready-tag {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #10b981;
          color: white;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
        }

        .form-actions {
          margin-top: 2rem;
        }

        /* Success Card Styles */
        .success-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 2.5rem;
          padding: 4rem;
          border: 1px solid rgba(16, 185, 129, 0.2);
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 0 50px rgba(16, 185, 129, 0.1);
          animation: cardPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes cardPop {
          from { transform: scale(0.9) translateY(30px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .success-header {
          margin-bottom: 3rem;
        }

        .confetti-icon {
          width: 80px;
          height: 80px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
        }

        .success-header h2 {
          font-size: 2.25rem;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.05em;
        }

        .qr-result-area {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2rem;
          padding: 2.5rem;
          display: flex;
          align-items: center;
          gap: 2.5rem;
          margin-bottom: 3rem;
        }

        .qr-box {
          position: relative;
          background: white;
          padding: 1.25rem;
          border-radius: 1.5rem;
          flex-shrink: 0;
        }

        .qr-box img {
          width: 160px;
          height: 160px;
          mix-blend-mode: multiply;
        }

        .qr-badge {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #3b82f6;
          color: white;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          white-space: nowrap;
        }

        .qr-meta {
          flex: 1;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .meta-row {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .meta-row .label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
        }

        .meta-row .value {
          font-weight: 700;
          font-size: 1.125rem;
        }

        .meta-row .value.link {
          color: #3b82f6;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
        }

        .progress-bar-container {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin: 1.5rem 0;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          width: 100%;
          background: #10b981;
          animation: progressRun 5s linear forwards;
          transform-origin: left;
        }

        @keyframes progressRun {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          border-radius: 1rem;
          font-weight: 700;
          transition: all 0.2s;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-secondary {
          background: #334155;
          color: white;
        }

        .btn-secondary:hover {
          background: #475569;
        }

        @media (max-width: 900px) {
          .upload-glass-card { grid-template-columns: 1fr; }
          .form-sidebar { display: none; }
          .form-main { padding: 2.5rem; }
        }
      `}</style>
    </div>
  );
}
