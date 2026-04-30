import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, X, CheckCircle2, Loader2, FileText, Info, ArrowLeft, Database, Globe, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

export default function ManualUpload({ user, onLogout, currentTheme, toggleTheme }) {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({ model_name: '', version: '', region: 'Global' });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a manual to upload.');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', metadata.model_name);
    formData.append('version', metadata.version);
    formData.append('region', metadata.region);

    try {
      await axios.post(`${API}/manuals/upload`, formData, {
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        activePage="upload" 
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
      />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '40px' }}>
          <ArrowLeft size={16} /> BACK TO REGISTRY
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'start' }}>
          {/* Upload Form */}
          <div className="animate-elite">
            <div style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>RESOURCE_INGESTION</div>
            <h1 className="heading-elite" style={{ fontSize: '2.5rem', marginBottom: '40px' }}>Initialize Manual.</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appliance Model Identity</label>
                <input
                  type="text"
                  className="input-elite"
                  placeholder="e.g. SmartFreeze v200"
                  value={metadata.model_name}
                  onChange={(e) => setMetadata({ ...metadata, model_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Version / Revision</label>
                  <input
                    type="text"
                    className="input-elite"
                    placeholder="e.g. Rev A"
                    value={metadata.version}
                    onChange={(e) => setMetadata({ ...metadata, version: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployment Region</label>
                  <select
                    className="input-elite"
                    style={{ appearance: 'none' }}
                    value={metadata.region}
                    onChange={(e) => setMetadata({ ...metadata, region: e.target.value })}
                  >
                    <option value="Global">Global</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                  </select>
                </div>
              </div>

              {/* Dropzone */}
              <div style={{ marginTop: '20px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>Resource File (PDF or Image)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                  />
                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', padding: '48px 32px', textAlign: 'center', transition: 'all 0.2s' }} id="dropzone">
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <FileText size={24} color="var(--color-accent)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{file.name}</span>
                        <button onClick={(e) => { e.preventDefault(); setFile(null); }} style={{ background: 'transparent', border: 'none', color: '#EF4444' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>Select manual to index</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Drag and drop or click to browse</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-elite" style={{ width: '100%', marginTop: '16px', padding: '16px' }} disabled={uploading}>
                {uploading ? (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800, marginBottom: '8px' }}>
                      <span>INGESTING_RESOURCES...</span>
                      <span>{progress}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'black', transition: 'width 0.2s' }} />
                    </div>
                  </div>
                ) : 'Initialize Indexing'}
              </button>
            </form>
          </div>

          {/* Info Panel */}
          <aside style={{ marginTop: '100px' }}>
            <div className="elite-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                   <Info size={16} />
                </div>
                <h4 className="heading-elite" style={{ fontSize: '1rem' }}>Ingestion Specs</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { icon: <Cpu size={14} />, label: 'OCR Processing', text: 'Images are automatically converted to searchable text blocks.' },
                  { icon: <Database size={14} />, label: 'Vector Indexing', text: 'Content is embedded into Pinecone for sub-200ms RAG retrieval.' },
                  { icon: <Globe size={14} />, label: 'Global CDN', text: 'All files are securely hosted on Cloudinary with global edge access.' }
                ].map((spec, i) => (
                  <div key={i} style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {spec.icon} {spec.label}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>{spec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
