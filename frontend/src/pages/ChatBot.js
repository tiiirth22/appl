import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Send, Bot, User, Loader2, QrCode, 
  ArrowLeft, Cpu, Activity, Zap, Shield, 
  ChevronRight, Scan, Clock, Terminal, Globe, 
  Database, Layers, MessageSquare, Info, History, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL as API } from '../config';
import Navbar from '../components/ui/Navbar';

export default function ChatBot({ currentTheme, toggleTheme }) {
  const [searchParams] = useSearchParams();
  const manualId = searchParams.get('manual_id');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !manualId) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        manual_id: manualId,
        question: input,
        history: messages.slice(-4)
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'SYSTEM_ERROR: Neural link interrupted.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', height: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--color-text-primary)', overflow: 'hidden' }}>
      <Navbar activePage="chat" currentTheme={currentTheme} toggleTheme={toggleTheme} />
      
      {/* ── Terminal Header ── */}
      <header style={{ padding: '12px 24px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-elevated)', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>LINK_ACTIVE</span>
          </div>
          <div style={{ width: '1px', height: '12px', background: 'var(--color-text-muted)', opacity: 0.3 }} />
          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800 }}>IDX_{manualId?.substring(0,8) || 'GLOBAL'}</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>P95: 142MS</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>LOAD: 0.08</div>
        </div>
      </header>

      {/* ── Cinematic Message Stream ── */}
      <main ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '60px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '64px' }}>
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '120px 0', textAlign: 'center' }}>
                 <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-accent)', letterSpacing: '0.5em', marginBottom: '40px' }}>AWAITING_SYSTEM_PROBE</div>
                 <h2 className="heading-elite" style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '24px' }}>Neural Diagnostic <br /> Terminal.</h2>
                 <p style={{ color: 'var(--color-text-dim)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto' }}>Submit high-precision diagnostic queries to the grounded RAG network.</p>
              </motion.div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-muted)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
                      {msg.role === 'user' ? 'OPERATOR_SIGNAL' : 'SYSTEM_RESPONSE'}
                    </div>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-text-muted)', opacity: 0.1 }} />
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    color: msg.role === 'user' ? 'var(--color-text-primary)' : 'var(--color-text-dim)',
                    lineHeight: 1.6,
                    fontWeight: msg.role === 'user' ? 600 : 500,
                    padding: msg.role === 'assistant' ? '40px' : '0',
                    background: msg.role === 'assistant' ? 'var(--color-bg-elevated)' : 'transparent',
                    borderRadius: '32px',
                    border: msg.role === 'assistant' ? 'var(--border-thin)' : 'none',
                    boxShadow: msg.role === 'assistant' ? '0 10px 40px rgba(0,0,0,0.1)' : 'none'
                  }}>
                    {msg.content}
                  </div>
                </motion.div>
              ))
            )}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Loader2 className="spinner" size={16} color="var(--color-accent)" />
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>SYNTHESIZING_RESPONSE...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Terminal Input Layer ── */}
      <footer style={{ padding: '60px 40px', borderTop: 'var(--border-thin)', background: 'var(--color-bg-base)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
               <button className="btn-elite-ghost" style={{ width: '56px', height: '56px', padding: 0, borderRadius: '18px' }}><Scan size={24} strokeWidth={1.5} /></button>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="INITIALIZE_DIAGNOSTIC_QUERY_STRING..."
              className="input-elite"
              style={{ flex: 1, padding: '22px 36px', borderRadius: '100px', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}
              onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
              disabled={loading}
            />
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleSend} className="btn-elite" 
              style={{ width: '56px', height: '56px', padding: 0, borderRadius: '18px' }}
              disabled={loading}
            >
              <ArrowRight size={24} />
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  );
}
