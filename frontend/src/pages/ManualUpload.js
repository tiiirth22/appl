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
                  <img src={qrData.image} alt="QR Code" style={{maxWidth: '300px'}} />
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
                    onChange={(e) => setFormData({...formData, model_name: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select
                    className="form-input"
                    data-testid="region-select"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
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
                      style={{display: 'none'}}
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
          background: #f7fafc;
        }

        .upload-container {
          max-width: 600px;
          margin: 3rem auto;
        }

        .upload-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .upload-header svg {
          color: #667eea;
          margin-bottom: 1rem;
        }

        .upload-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #2d3748;
        }

        .upload-header p {
          color: #718096;
        }

        .upload-form-wrapper {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .file-upload-area {
          border: 2px dashed #cbd5e0;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s;
          cursor: pointer;
        }

        .file-upload-area:hover {
          border-color: #667eea;
          background: #f7fafc;
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          color: #4a5568;
        }

        .file-upload-label svg {
          color: #667eea;
        }

        .file-types {
          font-size: 0.875rem;
          color: #a0aec0;
        }

        .btn-block {
          width: 100%;
          justify-content: center;
        }

        .success-message {
          background: white;
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: #c6f6d5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: #22543d;
        }

        .success-message h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #2d3748;
        }

        .success-message p {
          color: #718096;
          margin-bottom: 1rem;
        }

        .qr-preview {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 12px;
        }

        .redirect-text {
          color: #667eea;
          font-weight: 600;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
