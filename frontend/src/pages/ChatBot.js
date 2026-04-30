import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Send, Loader, User, Mic, Image as ImageIcon, X, Shield, 
  Paperclip, Maximize2, Info, ChevronDown, Youtube, ChevronRight, 
  ChevronLeft, AlertCircle, Camera, Zap, Cpu, ArrowLeft, MessageSquare, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE_URL as API } from '../config';
import LiveCameraOverlay from '../components/LiveCameraOverlay';

export default function ChatBot() {
  const [searchParams] = useSearchParams();
  const { qrId } = useParams();
  const [manualId, setManualId] = useState(null);
  const [manualInfo, setManualInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastQueryId, setLastQueryId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      if (qrId) {
        setLoadingQR(true);
        try {
          const response = await axios.get(`${API}/qr-details/${qrId}`);
          const { manual_id, model_name, version } = response.data;
          setManualId(manual_id);
          setManualInfo({ model_name, version });
          localStorage.setItem('manual_id', manual_id);

          setMessages([{
            type: 'bot',
            text: `Hello! I'm your ApplianceIQ assistant for the **${model_name}**. I've indexed your manual (v${version}). How can I help you today?`
          }]);
        } catch (error) {
          setMessages([{ type: 'bot', text: "I couldn't retrieve manual details. Ensure the link is correct." }]);
        } finally { setLoadingQR(false); }
      }
      else {
        const id = searchParams.get('manual_id');
        if (id) {
          setLoadingQR(true);
          try {
            const response = await axios.get(`${API}/manual-public/${id}`);
            const { model_name, version } = response.data;
            setManualId(id);
            setManualInfo({ model_name, version });
            setMessages([{ type: 'bot', text: `Hello! I'm your ApplianceIQ assistant for the **${model_name}**. How can I help?` }]);
          } catch (error) {
            setMessages([{ type: 'bot', text: "Manual details retrieval failed. Check link." }]);
          } finally { setLoadingQR(false); }
        } else if (!id && !qrId) {
          setMessages([{ type: 'bot', text: "⚠️ **Security Required**: Please scan the official QR code to start." }]);
        }
      }
    };
    initializeChat();
  }, [qrId, searchParams]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if ((!textToSend.trim() && !imageFile) || loading || !manualId) return;

    const userMessage = { type: 'user', text: textToSend, image: imagePreview };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = textToSend;
    const currentImage = imageFile;
    const token = localStorage.getItem('session_token');
    
    setInput(''); setImageFile(null); setImagePreview(null);
    setLoading(true);
    if (currentImage) setIsScanning(true);

    try {
      let response;
      if (currentImage) {
        const formData = new FormData();
        formData.append('file', currentImage);
        formData.append('manual_id', manualId);
        response = await fetch(`${API}/chat/image`, {
          method: 'POST',
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: formData
        });
      } else {
        response = await fetch(`${API}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ manual_id: manualId, question: currentInput, qr_id: qrId })
        });
      }

      if (!response.ok) throw new Error('Request failed');

      setIsScanning(false);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = { type: 'bot', text: '', sources: [], steps: [] };
      
      setMessages(prev => [...prev, botMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        if (chunk.startsWith('__METADATA__:')) {
          const parts = chunk.split('\n');
          const metaLine = parts[0].replace('__METADATA__:', '');
          try {
            const metadata = JSON.parse(metaLine);
            Object.assign(botMessage, metadata);
            const rest = parts.slice(1).join('\n');
            if (rest) botMessage.text += rest;
          } catch (e) { console.error('Meta parse error', e); }
        } else { botMessage.text += chunk; }

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...botMessage };
          return updated;
        });
      }
      setLoading(false);
    } catch (error) {
      setIsScanning(false);
      setMessages(prev => [...prev, { type: 'bot', text: "I encountered an error. Please try again." }]);
      setLoading(false);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        setInput(prev => prev + (prev ? ' ' : '') + e.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else { alert('Voice input not supported in this browser.'); }
  };

  if (loadingQR) {
    return (
      <div className="premium-loading">
        <div className="pulse-logo"></div>
        <p style={{ marginTop: '24px', color: 'var(--color-text-dim)', letterSpacing: '0.1em', fontSize: '0.8rem' }}>INITIALIZING INTELLIGENCE</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ height: '100vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Cpu size={18} />
          </div>
          <div>
            <span className="heading-premium" style={{ fontSize: '1rem', display: 'block' }}>ApplianceIQ Console</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 8px var(--color-success)' }} />
              SECURE ENGINE CONNECTED
            </span>
          </div>
        </Link>
        {manualInfo && (
          <div className="glass-panel" style={{ padding: '6px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
            {manualInfo.model_name} <span style={{ color: 'var(--color-primary)', marginLeft: '8px' }}>v{manualInfo.version}</span>
          </div>
        )}
      </header>

      {/* Messages Viewport */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="popLayout">
            {!manualId && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <Shield size={64} style={{ color: 'var(--color-primary)', marginBottom: '24px' }} />
                <h2 className="heading-premium" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Authentication Required</h2>
                <p style={{ color: 'var(--color-text-dim)', marginBottom: '32px' }}>Please scan the official QR code on your appliance to unlock high-fidelity AI support.</p>
              </motion.div>
            )}

            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`message-bubble ${m.type === 'user' ? 'message-user' : 'message-ai'}`} style={{ marginBottom: '24px' }}>
                {m.image && <img src={m.image} alt="upload" style={{ width: '100%', borderRadius: '12px', marginBottom: '12px' }} />}
                
                {m.is_vision && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#60A5FA', marginBottom: '12px' }}>
                    <Maximize2 size={12} /> Detected: {m.extracted_problem}
                  </div>
                )}

                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                {m.sources && m.sources.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={14} /> MANUAL CONTEXT: {[...new Set(m.sources.map(s => s.page))].filter(p => p > 0).map(p => `P.${p}`).join(', ') || 'Contextual'}
                  </div>
                )}

                {m.type === 'bot' && m.video_url && <YouTubeCard url={m.video_url} />}
                {m.type === 'bot' && m.steps && m.steps.length > 0 && <RepairSteps steps={m.steps} />}
                {m.type === 'bot' && m.severity && <SeverityBadge severity={m.severity} />}
                {m.type === 'bot' && m.cost && <CostEstimator cost={m.cost} />}
              </motion.div>
            ))}
            
            {loading && (
              <div className="message-bubble message-ai" style={{ width: 'fit-content' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3].map(d => <motion.span key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }} style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%' }} />)}
                </div>
              </div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Floating Input Console */}
      <footer style={{ padding: '24px', background: 'linear-gradient(to top, var(--color-bg-base), transparent)' }}>
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', padding: '10px', cursor: 'pointer' }}><Paperclip size={20} /></button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
          
          <textarea className="input-premium" rows="1" placeholder="Describe the issue or ask a question..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} style={{ border: 'none', background: 'none', boxShadow: 'none' }} />
          
          <button onClick={() => setIsCameraOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', padding: '10px', cursor: 'pointer' }}><Camera size={20} /></button>
          <button onClick={startListening} style={{ background: 'none', border: 'none', color: isListening ? '#EF4444' : 'var(--color-text-muted)', padding: '10px', cursor: 'pointer' }}><Mic size={20} /></button>
          <button onClick={handleSend} disabled={loading || (!input.trim() && !imageFile)} className="btn-premium" style={{ padding: '10px 16px', borderRadius: '12px' }}>
            {loading ? <Loader className="spinner" size={18} /> : <Send size={18} />}
          </button>
        </div>
        {imagePreview && (
          <div className="glass-panel" style={{ position: 'absolute', bottom: '100px', right: '40px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={imagePreview} style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ background: 'none', border: 'none', color: '#EF4444' }}><X size={16} /></button>
          </div>
        )}
      </footer>

      {isCameraOpen && <LiveCameraOverlay onClose={() => setIsCameraOpen(false)} onIssueDetected={(q) => { setIsCameraOpen(false); handleSend(q); }} manualId={manualId} />}
    </div>
  );
}

function YouTubeCard({ url }) {
  return (
    <motion.a href={url} target="_blank" className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', textDecoration: 'none', marginTop: '16px' }}>
      <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}><Youtube size={20} /></div>
      <div style={{ flex: 1 }}>
        <h5 style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>Visual Repair Guide</h5>
        <p style={{ margin: 0, color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>Step-by-step resolution on YouTube</p>
      </div>
      <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
    </motion.a>
  );
}

function RepairSteps({ steps }) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="glass-panel" style={{ marginTop: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)' }}>ACTIONABLE STEPS ({current + 1}/{steps.length})</span>
      </div>
      <div style={{ padding: '20px' }}>
        <h5 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'white' }}>{steps[current].title}</h5>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>{steps[current].description}</p>
        {steps[current].warning && <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#F59E0B', fontSize: '0.75rem', display: 'flex', gap: '8px' }}><AlertCircle size={14} /> {steps[current].warning}</div>}
      </div>
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
        <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="btn-premium" style={{ padding: '6px 12px', fontSize: '0.7rem', background: 'var(--color-bg-elevated)' }}><ChevronLeft size={16} /></button>
        <button disabled={current === steps.length - 1} onClick={() => setCurrent(c => c + 1)} className="btn-premium" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>Next Step</button>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const c = severity === 'critical' ? { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' } : severity === 'moderate' ? { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' } : { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
  return (
    <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: c.bg, border: `1px solid ${c.color}33`, color: c.color, fontSize: '0.7rem', fontWeight: 800 }}>
      <AlertCircle size={12} /> {severity.toUpperCase()} SEVERITY
    </div>
  );
}

function CostEstimator({ cost }) {
  return (
    <div className="glass-panel" style={{ marginTop: '16px', padding: '16px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'block', marginBottom: '12px' }}>REPAIR BUDGET ESTIMATES</span>
      <div style={{ display: 'flex', gap: '32px' }}>
        <div><span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>DIY</span><strong style={{ fontSize: '1.1rem' }}>{cost.diy}</strong></div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <div><span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>PRO</span><strong style={{ fontSize: '1.1rem' }}>{cost.professional}</strong></div>
      </div>
    </div>
  );
}
