import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, Loader, Check, ArrowRight, Shield, Globe, Info, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [dragOver, setDragOver] = useState(false);

  // Determine the current step
  const hasMetadata = formData.model_name && formData.version;
  const currentStep = uploading ? 3 : file ? 2 : 1;

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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const steps = [
    { num: 1, label: 'Metadata', desc: 'Model & region info' },
    { num: 2, label: 'Upload File', desc: 'PDF or image asset' },
    { num: 3, label: 'AI Indexing', desc: 'Vector processing' },
  ];

  return (
    <div className="iq-upload" id="upload-page">
      <Navbar user={user} onLogout={onLogout} activePage="upload" />

      <div className="iq-upload-main">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="iq-success-card"
              id="upload-success"
            >
              <div className="iq-success-icon">
                <Check size={32} />
              </div>
              <h2>Upload Complete</h2>
              <p>Your manual has been indexed and the QR code is ready.</p>

              {qrData && (
                <div className="iq-success-qr">
                  <div className="iq-qr-box">
                    <img src={qrData.image} alt="QR Code" />
                  </div>
                  <div className="iq-qr-info">
                    <div className="iq-qr-row">
                      <span className="iq-qr-label">Model</span>
                      <span className="iq-qr-value">{formData.model_name}</span>
                    </div>
                    <div className="iq-qr-row">
                      <span className="iq-qr-label">URL</span>
                      <span className="iq-qr-value mono">{qrData.url}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="iq-success-footer">
                <p className="iq-redirect-text">Redirecting to dashboard...</p>
                <div className="iq-progress-track">
                  <div className="iq-progress-fill" />
                </div>
                <Link to="/dashboard" className="iq-btn-ghost" id="go-dashboard-btn">
                  Go Now <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="iq-upload-layout"
            >
              {/* Step Sidebar */}
              <div className="iq-upload-sidebar">
                <div className="iq-steps-list">
                  {steps.map((step) => (
                    <div
                      key={step.num}
                      className={`iq-step ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}
                    >
                      <div className="iq-step-circle">
                        {currentStep > step.num ? <Check size={14} /> : step.num}
                      </div>
                      <div className="iq-step-text">
                        <span className="iq-step-label">{step.label}</span>
                        <span className="iq-step-desc">{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="iq-tips-card">
                  <h4><Info size={14} /> Pro Tips</h4>
                  <ul>
                    <li>Upload clear high-res PDFs for better OCR.</li>
                    <li>Include regional versions for localized info.</li>
                    <li>Index time: ~30s per 100 pages.</li>
                  </ul>
                </div>
              </div>

              {/* Main Form */}
              <div className="iq-upload-form-area">
                <div className="iq-form-header">
                  <h1>Upload New Manual</h1>
                  <p>Train your AI assistant with specialized product knowledge.</p>
                </div>

                <form onSubmit={handleSubmit} className="iq-form" id="upload-form">
                  {/* Model Name */}
                  <div className="iq-field">
                    <label>Appliance Model Name</label>
                    <div className="iq-input-wrap">
                      <Cpu size={16} className="iq-field-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Samsung Jet 75 Pet"
                        value={formData.model_name}
                        onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                        required
                        id="model-name-input"
                      />
                    </div>
                  </div>

                  {/* Version + Region Row */}
                  <div className="iq-field-row">
                    <div className="iq-field">
                      <label>Version</label>
                      <div className="iq-input-wrap">
                        <Shield size={16} className="iq-field-icon" />
                        <input
                          type="text"
                          placeholder="e.g. v2.4"
                          value={formData.version}
                          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                          required
                          id="version-input"
                        />
                      </div>
                    </div>
                    <div className="iq-field">
                      <label>Region</label>
                      <div className="iq-input-wrap">
                        <Globe size={16} className="iq-field-icon" />
                        <select
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                          id="region-select"
                        >
                          <option value="global">Global (Universal)</option>
                          <option value="us">North America (US/CA)</option>
                          <option value="eu">Europe (EMEA)</option>
                          <option value="asia">Asia Pacific (APAC)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div
                    className={`iq-dropzone ${file ? 'has-file' : ''} ${dragOver ? 'drag-hover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    id="file-dropzone"
                  >
                    <input
                      type="file"
                      id="file-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files[0])}
                      required
                    />
                    <label htmlFor="file-input" className="iq-dropzone-label">
                      <div className="iq-dropzone-icon">
                        {file ? <FileText size={28} /> : <Upload size={28} />}
                      </div>
                      <div className="iq-dropzone-text">
                        <span className="iq-dz-primary">{file ? file.name : 'Drop manual file here or click to browse'}</span>
                        <span className="iq-dz-secondary">PDF, PNG or JPEG · Max 25MB</span>
                      </div>
                      {file && <div className="iq-dz-ready">READY</div>}
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={uploading}
                    className="iq-submit-btn"
                    id="submit-upload-btn"
                  >
                    {uploading ? (
                      <>
                        <Loader className="spinner" size={18} />
                        Analyzing & Indexing...
                      </>
                    ) : (
                      <>
                        Index Manual <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .iq-upload {
          min-height: 100vh;
          background: #0B0F1A;
          color: #F9FAFB;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .iq-upload-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 40px 32px;
        }

        /* Layout */
        .iq-upload-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 32px;
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }

        /* Sidebar */
        .iq-upload-sidebar {
          background: rgba(0, 0, 0, 0.2);
          padding: 32px 24px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .iq-steps-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .iq-step {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0.35;
          transition: all 250ms;
        }
        .iq-step.active { opacity: 1; }

        .iq-step-circle {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
          flex-shrink: 0;
          transition: all 250ms;
        }
        .iq-step.current .iq-step-circle {
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          border-color: transparent;
          color: white;
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.3);
        }
        .iq-step.active:not(.current) .iq-step-circle {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: #10B981;
        }

        .iq-step-label {
          display: block;
          font-weight: 600;
          font-size: 0.8125rem;
        }
        .iq-step-desc {
          display: block;
          font-size: 0.6875rem;
          color: #6B7280;
        }

        /* Tips */
        .iq-tips-card {
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.12);
          padding: 20px;
          border-radius: 14px;
          margin-top: 32px;
        }
        .iq-tips-card h4 {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #60A5FA;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }
        .iq-tips-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .iq-tips-card li {
          font-size: 0.6875rem;
          color: #9CA3AF;
          padding-left: 16px;
          position: relative;
          line-height: 1.5;
        }
        .iq-tips-card li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #3B82F6;
        }

        /* Form Area */
        .iq-upload-form-area {
          padding: 40px;
        }
        .iq-form-header {
          margin-bottom: 32px;
        }
        .iq-form-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .iq-form-header p {
          color: #6B7280;
          margin-top: 4px;
          font-size: 0.9375rem;
        }

        .iq-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .iq-field label {
          display: block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6B7280;
          margin-bottom: 8px;
        }
        .iq-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .iq-field-icon {
          position: absolute;
          left: 14px;
          color: #4B5563;
          pointer-events: none;
        }
        .iq-input-wrap input,
        .iq-input-wrap select {
          width: 100%;
          background: #0B0F1A;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          color: #F9FAFB;
          font-size: 0.9375rem;
          transition: all 200ms;
        }
        .iq-input-wrap select {
          appearance: none;
          cursor: pointer;
        }
        .iq-input-wrap input:focus,
        .iq-input-wrap select:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }

        .iq-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* Dropzone */
        .iq-dropzone {
          position: relative;
          border: 2px dashed rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: all 250ms;
          background: rgba(255, 255, 255, 0.01);
        }
        .iq-dropzone:hover,
        .iq-dropzone.drag-hover {
          border-color: rgba(59, 130, 246, 0.4);
          background: rgba(59, 130, 246, 0.03);
        }
        .iq-dropzone.has-file {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.03);
          border-style: solid;
        }
        .iq-dropzone input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }
        .iq-dropzone-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
        }
        .iq-dropzone-icon {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6B7280;
          transition: all 250ms;
        }
        .iq-dropzone:hover .iq-dropzone-icon,
        .iq-dropzone.drag-hover .iq-dropzone-icon {
          color: #3B82F6;
          transform: scale(1.08);
        }
        .iq-dropzone.has-file .iq-dropzone-icon {
          color: #10B981;
        }
        .iq-dz-primary {
          font-size: 0.9375rem;
          font-weight: 600;
        }
        .iq-dz-secondary {
          font-size: 0.8125rem;
          color: #6B7280;
        }
        .iq-dz-ready {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #10B981;
          color: white;
          font-size: 0.5625rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 9999px;
          letter-spacing: 0.06em;
          z-index: 1;
        }

        /* Submit */
        .iq-submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.9375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 200ms;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
          margin-top: 8px;
        }
        .iq-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }
        .iq-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Success */
        .iq-success-card {
          background: #111827;
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          max-width: 560px;
          margin: 0 auto;
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.06);
        }
        .iq-success-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        }
        .iq-success-card h2 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }
        .iq-success-card > p {
          color: #6B7280;
          font-size: 0.9375rem;
          margin-bottom: 32px;
        }

        .iq-success-qr {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
          text-align: left;
        }
        .iq-qr-box {
          background: white;
          padding: 16px;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .iq-qr-box img { width: 120px; height: 120px; display: block; }
        .iq-qr-info { display: flex; flex-direction: column; gap: 12px; }
        .iq-qr-row { display: flex; flex-direction: column; gap: 2px; }
        .iq-qr-label { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; color: #6B7280; }
        .iq-qr-value { font-weight: 600; font-size: 0.9375rem; }
        .iq-qr-value.mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem; color: #60A5FA; }

        .iq-success-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .iq-redirect-text { font-size: 0.75rem; color: #4B5563; }
        .iq-progress-track {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 4px;
          overflow: hidden;
        }
        .iq-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #059669);
          animation: progressGrow 5s linear forwards;
          transform-origin: left;
        }
        @keyframes progressGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .iq-btn-ghost {
          background: #1F2937;
          color: #F9FAFB;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8125rem;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 200ms;
        }
        .iq-btn-ghost:hover { background: #263244; }

        /* Responsive */
        @media (max-width: 900px) {
          .iq-upload-layout { grid-template-columns: 1fr; }
          .iq-upload-sidebar { display: none; }
          .iq-upload-form-area { padding: 24px; }
        }
        @media (max-width: 600px) {
          .iq-field-row { grid-template-columns: 1fr; }
          .iq-success-qr { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
