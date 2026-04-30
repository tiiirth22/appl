import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Send, Camera, Image as ImageIcon, X, Loader2, Cpu, ArrowLeft, MessageSquare, Shield, Info, AlertTriangle, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE_URL as API } from '../config';
import LiveCameraOverlay from '../components/LiveCameraOverlay';

// ── Shared Diagnostic Panels ──
const RepairStepPanel = ({ steps }) => (
  <div className="elite-panel" style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)' }}>
    <div style={{ padding: '12px 16px', borderBottom: 'var(--border-thin)', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase' }}>DIAGNOSTIC_REPAIR_STEPS</div>
    <div style={{ padding: '16px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < steps.length - 1 ? '12px' : 0 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>0{i+1}</div>
          <div style={{ fontSize: '0.85rem', color: 'white', lineHeight: 1.5 }}>{step}</div>
        </div>
      ))}
    </div>
  </div>
);

const CostAnalysisPanel = ({ estimate }) => (
  <div className="elite-panel" style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', fontSize: '0.65rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>COST_ANALYSIS_PROJECTED</div>
    <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{estimate}</div>
        <div style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700 }}>ESTIMATED MARKET RATE</div>
      </div>
      <CheckCircle2 size={24} color="#10B981" />
    </div>
  </div>
);

export default function ChatBot({ currentTheme, toggleTheme }) {
  const [searchParams] = useSearchParams();
  const manualId = searchParams.get('manual_id');
  const qrId = searchParams.get('qr_id');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (manualId || qrId) {
      const idType = qrId ? 'QR_KEY' : 'MANUAL_ID';
      const idVal = qrId || manualId;
      setMessages([{ 
        role: 'ai', 
        content: `System ready. Connected via ${idType}:${idVal}. How can I assist with your appliance today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [manualId, qrId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideInput) => {
    const text = overrideInput || input;
    if (!text.trim() && !imageFile) return;

    const userMsg = { 
      role: 'user', 
      content: text, 
      image: imagePreview,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        manual_id: manualId,
        qr_id: qrId,
        question: text,
        image_data: imagePreview
      }, { withCredentials: true });

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: response.data.answer,
        repair_steps: response.data.repair_steps,
        cost_estimate: response.data.cost_estimate,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: "SYSTEM_ERROR: Failed to retrieve data from RAG engine." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="chat" currentTheme={currentTheme} toggleTheme={toggleTheme} />
      
      {/* Elite Chat Header */}
      <header style={{ padding: '16px 40px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#020408' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={{ color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center' }}><ArrowLeft size={18} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
              <Cpu size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>ApplianceIQ Console</div>
              <div style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 800 }}>● NODE_CONNECTED</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-elite-ghost" style={{ padding: '6px 12px', fontSize: '0.65rem' }}>HISTORY</button>
          <button className="btn-elite-ghost" style={{ padding: '6px 12px', fontSize: '0.65rem' }}>SPECS</button>
        </div>
      </header>

      {/* Message Stream */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '4px', flexShrink: 0,
                  background: msg.role === 'ai' ? 'white' : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: msg.role === 'ai' ? 'black' : 'white'
                }}>
                  {msg.role === 'ai' ? <Cpu size={16} /> : <MessageSquare size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{msg.role === 'ai' ? 'System_Agent' : 'Authorized_Operator'}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{msg.timestamp}</span>
                  </div>
                  {msg.image && <img src={msg.image} alt="User Upload" style={{ maxWidth: '300px', borderRadius: '8px', border: 'var(--border-thin)', marginBottom: '12px' }} />}
                  <div style={{ fontSize: '0.95rem', color: 'white', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                  {msg.repair_steps && <RepairStepPanel steps={msg.repair_steps} />}
                  {msg.cost_estimate && <CostAnalysisPanel estimate={msg.cost_estimate} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                <Cpu size={16} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
                <Loader2 className="spinner" size={14} /> PROCESSING_QUERY...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Elite Input Console */}
      <footer style={{ padding: '24px 40px', borderTop: 'var(--border-thin)', background: '#020408' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          {imagePreview && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, padding: '16px', background: 'var(--color-bg-elevated)', border: 'var(--border-thin)', borderRadius: '8px 8px 0 0', marginBottom: '-1px' }}>
              <img src={imagePreview} style={{ height: '60px', borderRadius: '4px' }} />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: -8, right: -8, background: '#EF4444', border: 'none', color: 'white', borderRadius: '50%', width: '20px', height: '20px' }}><X size={12} /></button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', background: '#0D1117', border: 'var(--border-thin)', borderRadius: '12px', padding: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
               <button onClick={() => setIsCameraOpen(true)} className="btn-elite-ghost" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '8px' }}><Camera size={18} /></button>
               <button onClick={() => document.getElementById('chat-file').click()} className="btn-elite-ghost" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '8px' }}><ImageIcon size={18} /></button>
               <input id="chat-file" type="file" hidden onChange={(e) => {
                 const f = e.target.files[0];
                 if(f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
               }} />
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              placeholder="Query system for technical data..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px', fontSize: '0.9rem', outline: 'none', resize: 'none', height: '40px', fontFamily: 'inherit' }}
            />
            <button onClick={() => handleSend()} className="btn-elite" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '8px' }} disabled={loading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </footer>

      {isCameraOpen && <LiveCameraOverlay onClose={() => setIsCameraOpen(false)} onIssueDetected={(q) => { setIsCameraOpen(false); handleSend(q); }} manualId={manualId} />}
    </div>
  );
}
