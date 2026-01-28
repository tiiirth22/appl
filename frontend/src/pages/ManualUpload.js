import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, LogOut, FileText, Loader, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.detail || 'Failed to upload manual');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page" data-testid="upload-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <h2 className="navbar-brand">ApplianceIQ</h2>
          <div className="navbar-links">
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
            <Link to="/upload" className="navbar-link">Upload Manual</Link>
            <Link to="/analytics" className="navbar-link">Analytics</Link>
          </div>
          <div className="navbar-user">
            <img src={user.picture || 'https://via.placeholder.com/40'} alt={user.name} />
            <span>{user.name}</span>
            <button onClick={onLogout} className="btn-logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="upload-container">
          {success ? (
            <div className="success-message" data-testid="success-message">
              <div className="success-icon">
                <Check size={48} />
              </div>
              <h2>Manual Uploaded Successfully!</h2>
              <p>Your manual has been processed and QR code generated.</p>
              {qrData && (
                <div className="qr-preview">
                  <img src={qrData.image} alt="QR Code" style={{ maxWidth: '300px' }} />
                  <p><strong>Short URL:</strong> {qrData.url}</p>
                </div>
              )}
              <p className="redirect-text">Redirecting to dashboard...</p>
            </div>
          ) : (
            <div className="upload-form-wrapper">
              <div className="upload-header">
                <FileText size={48} />
                <h1 data-testid="upload-title">Upload Appliance Manual</h1>
                <p>Upload PDF or image files. We'll extract text and create a QR code for your chatbot.</p>
              </div>

              <form onSubmit={handleSubmit} className="upload-form" data-testid="upload-form">
                <div className="form-group">
                  <label className="form-label">Appliance Model Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="model-name-input"
                    placeholder="e.g., Refrigerator XR-2000"
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Version *</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="version-input"
                    placeholder="e.g., v1.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select
                    className="form-input"
                    data-testid="region-select"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  >
                    <option value="global">Global</option>
                    <option value="us">United States</option>
                    <option value="eu">Europe</option>
                    <option value="asia">Asia</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Manual (PDF or Image) *</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="file-input"
                      data-testid="file-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files[0])}
                      required
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-input" className="file-upload-label">
                      <Upload size={32} />
                      <span>{file ? file.name : 'Click to select file'}</span>
                      <span className="file-types">PDF, PNG, JPG (max 10MB)</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  data-testid="submit-btn"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader className="spinner" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Upload Manual
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .upload-page {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #fdfcfb 0%, #e2d1c3 100%);
          color: #2d3748;
        }

        .navbar {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-brand {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .navbar-links {
          display: flex;
          gap: 2rem;
        }

        .navbar-link {
          color: #4a5568;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
          position: relative;
        }

        .navbar-link:after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          background: #667eea;
          transition: width 0.3s;
        }

        .navbar-link:hover:after {
          width: 100%;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .navbar-user img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #667eea;
        }

        .btn-logout {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.05);
          color: #4a5568;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.3s;
        }

        .btn-logout:hover {
          background: #feb2b2;
          color: #c53030;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .upload-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .upload-form-wrapper {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .upload-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .upload-header svg {
          color: #667eea;
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 4px 6px rgba(102, 126, 234, 0.3));
        }

        .upload-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: #1a202c;
          letter-spacing: -0.025em;
        }

        .upload-header p {
          color: #718096;
          font-size: 1.125rem;
        }

        .form-group {
          margin-bottom: 2rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #4a5568;
          font-size: 0.95rem;
        }

        .form-input {
          width: 100%;
          padding: 1rem 1.25rem;
          background: white;
          border: 2px solid transparent;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        .file-upload-area {
          border: 2px dashed #cbd5e0;
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          transition: all 0.3s;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.5);
        }

        .file-upload-area:hover {
          border-color: #667eea;
          background: #fff;
          transform: scale(1.02);
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
        }

        .file-upload-label span {
          font-weight: 600;
          color: #2d3748;
        }

        .file-types {
          font-size: 0.8rem !important;
          color: #a0aec0 !important;
          font-weight: 400 !important;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 2.5rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.125rem;
          transition: all 0.3s;
          border: none;
          cursor: pointer;
          width: 100%;
          justify-content: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success-message {
          background: white;
          border-radius: 24px;
          padding: 4rem;
          text-align: center;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .success-icon {
          width: 100px;
          height: 100px;
          background: #c6f6d5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          color: #2f855a;
          box-shadow: 0 8px 20px rgba(72, 187, 120, 0.2);
        }

        .qr-preview {
          margin: 3rem 0;
          padding: 2.5rem;
          background: #f7fafc;
          border-radius: 20px;
          border: 1px dashed #cbd5e0;
        }

        .qr-preview img {
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
          transition: transform 0.3s;
        }

        .qr-preview img:hover {
          transform: scale(1.05);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .upload-form-wrapper {
            padding: 2rem;
          }
          .upload-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
