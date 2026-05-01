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
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
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
          history: messages.slice(-4).map(m => ({ 
            role: m.role, 
            content: m.content 
          }))
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
    <div style={{ 
      backgroundColor: 'var(--color-bg-base)', 
      height: '100vh', 
      maxHeight: '100vh',
      display: 'flex', 
      flexDirection: 'column', 
      color: 'var(--color-text-primary)', 
      overflow: 'hidden' 
    }}>
      <Navbar activePage="chat" currentTheme={currentTheme} toggleTheme={toggleTheme} />
      
      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: '1fr 320px', 
        overflow: 'hidden',
        minHeight: 0 // Critical fix for Firefox/Chrome flex-grid scrolling
      }}>
        {/* ── Main Terminal Area ── */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: 'var(--border-thin)', 
          background: 'var(--color-bg-base)',
          minHeight: 0 
        }}>
          <header style={{ padding: '12px 24px', borderBottom: 'var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-elevated)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981' }} />
              <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 800 }}>DIAGNOSTIC_LINK_ACTIVE</span>
            </div>
          </header>

          <main className="chat-container" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px 40px', 
            scrollBehavior: 'smooth',
            display: 'block', // Ensure block display for proper overflow
            WebkitOverflowScrolling: 'touch'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '100px 0', textAlign: 'center' }}>
                     <div style={{ color: 'var(--color-text-muted)', marginBottom: '24px', opacity: 0.3 }}><Terminal size={64} /></div>
                     <h2 className="heading-elite" style={{ fontSize: '2rem', marginBottom: '12px' }}>Terminal_Standby.</h2>
                     <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem' }}>Awaiting diagnostic query for index <span className="mono" style={{ color: 'var(--color-text-primary)' }}>{manualId || 'GLOBAL_SYSTEM'}</span></p>
                  </motion.div>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ 
                        display: 'flex', 
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        gap: '16px',
                        width: '100%'
                      }}
                    >
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: msg.role === 'assistant' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: msg.role === 'assistant' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                        flexShrink: 0
                      }}>
                        {msg.role === 'assistant' ? <Bot size={18} color="#10B981" /> : <User size={18} color="#3B82F6" />}
                      </div>

                      <div style={{ 
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{ 
                          fontSize: '0.95rem', 
                          lineHeight: 1.6, 
                          color: msg.role === 'user' ? '#FFFFFF' : 'var(--color-text-primary)',
                          background: msg.role === 'user' ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'var(--color-bg-elevated)',
                          padding: '16px 24px',
                          borderRadius: '20px',
                          border: msg.role === 'user' ? 'none' : 'var(--border-thin)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        }}>
                          <MarkdownText text={msg.content} />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              
              {loading && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Loader2 className="spinner" size={16} color="var(--color-text-muted)" />
                  <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>INFERENCE_IN_PROGRESS...</span>
                </div>
              )}
              <div ref={bottomRef} style={{ height: '1px' }} />
            </div>
          </main>

          <footer style={{ padding: '24px 40px', borderTop: 'var(--border-thin)', background: 'var(--color-bg-elevated)', flexShrink: 0 }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="TYPE_DIAGNOSTIC_QUERY_HERE..."
                className="input-elite"
                style={{ flex: 1, padding: '16px 24px', borderRadius: '12px', fontSize: '1rem' }}
                onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                disabled={loading}
              />
              <button onClick={handleSend} className="btn-elite" style={{ padding: '0 24px', borderRadius: '12px' }} disabled={loading}>
                <Send size={20} />
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
