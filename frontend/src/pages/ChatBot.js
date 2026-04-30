import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Send, Bot, User, Loader2, QrCode, 
  ArrowLeft, Cpu, Activity, Zap, Shield, 
  ChevronRight, Scan, Clock, Terminal, Globe, 
  Database, Layers, MessageSquare, Info, History, 
  ArrowRight, Settings, ExternalLink, Box
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'SYSTEM_ERROR: Neural link interrupted. Check your network or diagnostic index status.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)', height: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--color-text-primary)', overflow: 'hidden' }}>
      <Navbar activePage="chat" currentTheme={currentTheme} toggleTheme={toggleTheme} />
      
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden' }}>
        {/* ── Main Terminal Area ── */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: 'var(--border-thin)', background: 'var(--color-bg-base)' }}>
          <header style={{ padding: '12px 24px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981' }} />
              <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 800 }}>DIAGNOSTIC_LINK_ACTIVE</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
               <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>LATENCY: 142ms</span>
               <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>TOKENS: 4.2k/8k</span>
            </div>
          </header>

          <main ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '80px 0', textAlign: 'center' }}>
                     <div style={{ color: 'var(--color-text-muted)', marginBottom: '24px', opacity: 0.3 }}><Terminal size={48} /></div>
                     <h2 className="heading-elite" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Terminal Standby.</h2>
                     <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Awaiting diagnostic query for index <span className="mono">{manualId || 'GLOBAL'}</span></p>
                  </motion.div>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span className="mono" style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{msg.role.toUpperCase()}</span>
                         <div style={{ flex: 1, height: '1px', background: 'var(--color-bg-surface)' }} />
                      </div>
                      <div style={{ 
                        fontSize: '1rem', lineHeight: 1.6, color: msg.role === 'user' ? 'var(--color-text-primary)' : 'var(--color-text-dim)',
                        background: msg.role === 'assistant' ? 'var(--color-bg-elevated)' : 'transparent',
                        padding: msg.role === 'assistant' ? '24px' : '0',
                        borderRadius: '12px', border: msg.role === 'assistant' ? 'var(--border-thin)' : 'none'
                      }}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))
                )}
                {loading && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Loader2 className="spinner" size={14} color="var(--color-text-muted)" />
                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>PROCESS_INFERENCE...</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </main>

          <footer style={{ padding: '32px 40px', borderTop: 'var(--border-thin)', background: 'var(--color-bg-elevated)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Submit diagnostic query..."
                className="input-elite"
                style={{ flex: 1, padding: '12px 20px', borderRadius: '8px' }}
                onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                disabled={loading}
              />
              <button onClick={handleSend} className="btn-elite" style={{ padding: '12px', borderRadius: '8px' }} disabled={loading}>
                <Send size={18} />
              </button>
            </div>
          </footer>
        </div>

        {/* ── Metadata Sidebar ── */}
        <aside style={{ background: 'var(--color-bg-elevated)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
           <div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Active Context</h3>
              <div className="elite-panel" style={{ padding: '16px', background: 'var(--color-bg-base)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Database size={16} color="var(--color-text-muted)" />
                    <div className="mono" style={{ fontSize: '0.7rem', fontWeight: 700 }}>IDX_{manualId?.substring(0,8) || 'NULL'}</div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={16} color="#10B981" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981' }}>GROUNDED_RAG</span>
                 </div>
              </div>
           </div>

           <div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Neural Infrastructure</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {[
                   { l: 'MODEL', v: 'Llama 3.1-70B' },
                   { l: 'EMBEDDING', v: 'Text-v3-Small' },
                   { l: 'K-VALUE', v: '4' },
                   { l: 'TOP_P', v: '0.9' }
                 ].map((item, i) => (
                   <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{item.l}</span>
                      <span className="mono" style={{ fontSize: '0.65rem', fontWeight: 700 }}>{item.v}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div style={{ marginTop: 'auto' }}>
              <button className="btn-elite-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}>
                <Settings size={14} /> System Config
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
}
