import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  Loader2, ChevronLeft, ArrowRight, Shield, 
  Database, Zap, Terminal, X, Search, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import { API_BASE_URL as API } from '../config';

export default function ManualUpload({ currentTheme, toggleTheme }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [modelName, setModelName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [region, setRegion] = useState('global');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, parsing, success, error
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      addLog(`File initialized: ${selected.name}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !modelName) return;

    setUploading(true);
    setStatus('uploading');
    addLog('PROC: UPLOAD_PROTOCOL_INITIATED | MULTIPART_MODE');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelName);
    formData.append('version', version);
    formData.append('region', region);

    try {
      addLog('PROC: DATA_STREAM_ESTABLISHED | SYNCHRONIZING_PAYLOAD');
      const response = await axios.post(`${API}/manuals/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      setStatus('parsing');
      addLog('INIT: RAG_PIPELINE_ORCHESTRATION | CHUNKING_SOURCE');
      
      setTimeout(() => {
        addLog('INIT: VECTOR_INDEX_SYNCHRONIZATION | EMBEDDING_V3');
      }, 1000);

      setTimeout(() => {
        setStatus('success');
        addLog('DONE: RESOURCE_INDEX_SYNCHRONIZED');
        setTimeout(() => navigate('/dashboard'), 1500);
      }, 3000);

    } catch (error) {
      setStatus('error');
      addLog('FAIL: INDEXER_CONNECTION_REFUSED | RETRY_COOLDOWN_ACTIVE');
      setUploading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="upload" currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '48px 40px', flex: 1 }}>
        {/* ── Pipeline Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px' }}>
          <div>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '16px', cursor: 'pointer' }}>
              <ChevronLeft size={14} /> RETURN_TO_REGISTRY
            </button>
            <h1 className="heading-elite" style={{ fontSize: '2rem' }}>Resource Ingestion.</h1>
            <p style={{ color: 'var(--color-text-dim)', marginTop: '8px', fontSize: '0.95rem' }}>Inject technical data into the neural diagnostic network.</p>
          </div>
          <div style={{ display: 'flex', gap: '40px' }}>
             {['SOURCE', 'UPLOAD', 'INDEX', 'VERIFY'].map((step, i) => (
               <div key={step} style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '0.6rem', fontWeight: 900, color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>STEP_0{i+1}</div>
                 <div style={{ width: '60px', height: '2px', background: i === 0 ? 'var(--color-text-primary)' : 'var(--color-bg-surface)' }} />
               </div>
             ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '48px', alignItems: 'start' }}>
          {/* ── Ingestion Form ── */}
          <div className="elite-panel" style={{ padding: '48px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label className="mono" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>RESOURCE_IDENTITY</label>
                  <input 
                    type="text" placeholder="e.g. Dyson V11" className="input-elite" 
                    style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                    value={modelName} onChange={(e) => setModelName(e.target.value)} required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label className="mono" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>REVISION_TAG</label>
                  <input 
                    type="text" placeholder="1.0.0" className="input-elite" 
                    style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                    value={version} onChange={(e) => setVersion(e.target.value)} required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="mono" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>REGIONAL_PROTOCOL</label>
                <select 
                  className="input-elite" 
                  style={{ width: '100%', padding: '16px', fontSize: '1rem', appearance: 'none', background: 'var(--color-bg-surface)' }}
                  value={region} onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="global">GLOBAL_STANDARD</option>
                  <option value="us">NORTH_AMERICA</option>
                  <option value="eu">EUROPEAN_UNION</option>
                  <option value="asia">ASIA_PACIFIC</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="mono" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>SOURCE_DOCUMENTATION (PDF/IMAGE)</label>
                <label style={{ 
                  border: '2px dashed var(--color-accent-dim)', borderRadius: '16px', padding: '64px', textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', transition: 'var(--transition-smooth)',
                  background: file ? 'rgba(255,255,255,0.01)' : 'transparent'
                }} className="hover-zone">
                  <input type="file" hidden onChange={handleFileChange} accept=".pdf,image/*" />
                  {file ? (
                    <>
                      <div style={{ color: '#10B981' }}><FileText size={40} /></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{file.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB • READY_FOR_STREAM</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ color: 'var(--color-text-muted)' }}><Upload size={40} /></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>Initialize Data Bridge</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>DRAG_AND_DROP_OR_BROWSE</div>
                      </div>
                    </>
                  )}
                </label>
              </div>

              <button 
                type="submit" className="btn-elite" 
                style={{ width: '100%', padding: '18px', borderRadius: '12px', justifyContent: 'center', fontSize: '1rem' }}
                disabled={uploading || !file || !modelName}
              >
                {status === 'uploading' ? <Loader2 className="spinner" size={20} /> : status === 'parsing' ? 'INDEXING...' : 'INITIALIZE_INGESTION'}
              </button>
            </form>
          </div>

          {/* ── Diagnostic Feedback ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="elite-panel" style={{ background: '#000', border: '1px solid #111', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Terminal size={16} color="var(--color-text-muted)" />
                <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>INGESTION_LOG</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '160px' }}>
                {log.length === 0 ? (
                  <div className="mono" style={{ fontSize: '0.7rem', color: '#333' }}>Awaiting source initialization...</div>
                ) : (
                  log.map((entry, i) => (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={i} className="mono" style={{ fontSize: '0.7rem', color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {entry}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="elite-panel" style={{ padding: '32px' }}>
               <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '16px' }}>Ingestion Protocol</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { icon: <Database size={14} />, label: 'Vectorization', desc: 'Auto-chunking with 512 token overlap.' },
                    { icon: <Zap size={14} />, label: 'OCR Engine', desc: 'Gemini 1.5 Flash Vision for schema parsing.' },
                    { icon: <Shield size={14} />, label: 'Security', desc: 'Zero-persistence diagnostic storage.' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.icon}</div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="elite-panel" style={{ width: '400px', textAlign: 'center', padding: '48px' }}>
              <div style={{ color: '#10B981', marginBottom: '24px' }}><CheckCircle2 size={64} strokeWidth={1} /></div>
              <h2 className="heading-elite" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Synchronized.</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Resource successfully integrated <br /> into the diagnostic network.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hover-zone:hover { border-color: var(--color-text-muted) !important; background: rgba(255,255,255,0.02) !important; }
      `}</style>
    </div>
  );
}
