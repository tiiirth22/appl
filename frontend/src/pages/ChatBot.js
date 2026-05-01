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

const MarkdownText = ({ text }) => {
  if (!text) return null;
  
  // Basic markdown-ish formatting
  const lines = text.split('\n');
  return (
    <div className="markdown-content">
      {lines.map((line, idx) => {
        let content = line;
        
        // Handle Bold
        if (content.includes('**')) {
          const parts = content.split('**');
          content = parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: 'var(--color-text-primary)' }}>{part}</strong> : part);
        }

        // Handle Lists
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '4px', paddingLeft: '8px' }}>
              <div style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>ΓÇó</div>
              <div style={{ flex: 1 }}>{content}</div>
            </div>
          );
        }

        return (
          <p key={idx} style={{ marginBottom: line.trim() === '' ? '12px' : '8px', minHeight: line.trim() === '' ? '8px' : 'auto' }}>
            {content}
          </p>
        );
      })}
    </div>
  );
};

export default function ChatBot({ currentTheme, toggleTheme }) {
  const [searchParams] = useSearchParams();
  const manualId = searchParams.get('manual_id');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !manualId) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual_id: manualId,
          question: input,
          history: messages.slice(-4)
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsgStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        let cleanChunk = chunk;
        let metadataObj = null;

        if (chunk.includes('__METADATA__:')) {
          const parts = chunk.split('\n');
          const metaLine = parts[0].replace('__METADATA__:', '');
          try {
            metadataObj = JSON.parse(metaLine);
          } catch (e) {
            console.warn('Metadata parse failed');
          }
          cleanChunk = parts.slice(1).join('\n');
        }

        if (!cleanChunk && !metadataObj) continue;

        if (!assistantMsgStarted) {
          assistantMsgStarted = true;
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: cleanChunk,
            video_url: metadataObj?.video_url 
          }]);
        } else {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              const updated = [...prev];
              updated[updated.length - 1] = { 
                ...last, 
                content: last.content + cleanChunk,
                video_url: metadataObj?.video_url || last.video_url
              };
              return updated;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'SYSTEM_ERROR: Connection failed.' }]);
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
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'row',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        gap: '12px',
                        width: '100%'
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: 'rgba(16, 185, 129, 0.1)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          marginTop: '4px'
                        }}>
                          <Bot size={16} color="#10B981" />
                        </div>
                      )}

                      <div style={{ 
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                      }}>
                        <div className="mono" style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: 800, 
                          color: 'var(--color-text-muted)',
                          marginBottom: '4px',
                          padding: '0 4px'
                        }}>
                          {msg.role === 'assistant' ? 'APPLIANCE_IQ_BOT' : 'OPERATOR'}
                        </div>
                        
                        <div style={{ 
                          fontSize: '0.95rem', 
                          lineHeight: 1.5, 
                          color: msg.role === 'user' ? '#FFFFFF' : 'var(--color-text-primary)',
                          background: msg.role === 'user' ? '#3B82F6' : 'var(--color-bg-elevated)',
                          padding: '16px 20px',
                          borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                          border: msg.role === 'user' ? 'none' : 'var(--border-thin)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}>
                          <MarkdownText text={msg.content} />
                          
                          {msg.video_url && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(16, 185, 129, 0.1)', paddingTop: '12px' }}>
                              <a 
                                href={msg.video_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-elite"
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  padding: '8px 12px', 
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#EF4444',
                                  fontSize: '0.8rem',
                                  textDecoration: 'none',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  width: 'fit-content'
                                }}
                              >
                                <ExternalLink size={14} />
                                Watch Video Tutorial
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          marginTop: '4px'
                        }}>
                          <User size={16} color="#3B82F6" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0' }}
                >
                  <Loader2 className="spinner" size={14} color="var(--color-text-muted)" />
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>NEURAL_LINK_INFERENCE...</span>
                </motion.div>
              )}
              <div style={{ height: '20px' }} />
              <div ref={scrollRef} />
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
