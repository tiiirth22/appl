import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Send, Loader, Bot, User, Star, Mic, Image as ImageIcon, X, Shield, 
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
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
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
          console.error('Error fetching QR details:', error);
          setMessages([{
            type: 'bot',
            text: "I couldn't retrieve the specific manual details for this QR code. Please ensure the link is correct."
          }]);
        } finally {
          setLoadingQR(false);
        }
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
            
            setMessages([{
              type: 'bot',
              text: `Hello! I'm your ApplianceIQ assistant for the **${model_name}**. I've indexed your manual (v${version}). How can I help?`
            }]);
          } catch (error) {
            console.error('Error fetching manual details:', error);
            setMessages([{
              type: 'bot',
              text: "I couldn't retrieve the specific manual details. Please check your link."
            }]);
          } finally {
            setLoadingQR(false);
          }
        } else if (!id && !qrId) {
          setMessages([{
            type: 'bot',
            text: "⚠️ **Security Required**: Please scan the official QR code on your appliance to start a session."
          }]);
        }
      }
    };

    initializeChat();
  }, [qrId, searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if ((!textToSend.trim() && !imageFile) || loading || !manualId) return;

    const userMessage = { 
      type: 'user', 
      text: textToSend, 
      image: imagePreview 
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = textToSend;
    const currentImage = imageFile;
    const token = localStorage.getItem('session_token');
    
    setInput('');
    setImageFile(null);
    setImagePreview(null);
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
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: formData
        });
      } else {
        response = await fetch(`${API}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ 
            manual_id: manualId, 
            question: currentInput,
            qr_id: qrId
          })
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
            botMessage.sources = metadata.sources || [];
            botMessage.video_url = metadata.video_url;
            botMessage.steps = metadata.steps || [];
            botMessage.severity = metadata.severity;
            botMessage.cost = metadata.cost;
            botMessage.extracted_problem = metadata.extracted_problem;
            botMessage.is_vision = metadata.is_vision;
            botMessage.fallback = metadata.fallback;
            botMessage.from_manual = metadata.from_manual;
            botMessage.cache = metadata.cache;
            
            const rest = parts.slice(1).join('\n');
            if (rest) botMessage.text += rest;
          } catch (e) { console.error('Meta parse error', e); }
        } else {
          botMessage.text += chunk;
        }

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...botMessage };
          return updated;
        });
      }

      setLoading(false);
      setShowFeedback(true);
    } catch (error) {
      console.error('Chat error:', error);
      setIsScanning(false);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I apologize, but I encountered an error. Please try again."
      }]);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerAutoSend = (query) => {
    setIsCameraOpen(false);
    handleSend(query);
  };

  const submitFeedback = async (rating) => {
    if (!lastQueryId) return;
    try {
      await axios.post(`${API}/feedback`, { query_id: lastQueryId, rating: rating });
      setShowFeedback(false);
    } catch (error) { console.error('Feedback error:', error); }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        setInput(prev => prev + (prev ? ' ' : '') + e.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert('Voice input is not supported in this browser.');
    }
  };

  if (loadingQR) {
    return (
      <div className="iq-chat-page">
        <div className="iq-chat-loader">
          <div className="iq-loader-glow">
             <Cpu size={48} className="iq-spin-cpu" />
          </div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          >
            Initializing Intelligence...
          </motion.h2>
          <p>Syncing product knowledge base</p>
        </div>
      </div>
    );
  }

  return (
    <div className="iq-chat-page">
      <header className="iq-chat-header">
        <div className="iq-chat-header-inner">
          <Link to="/" className="iq-chat-brand">
            <div className="iq-brand-icon-sm">
              <Cpu size={16} />
            </div>
            <div className="iq-chat-ident">
              <h3>ApplianceIQ</h3>
              <span className="iq-status">
                <span className="iq-status-dot" /> Knowledge Active
              </span>
            </div>
          </Link>

          {manualInfo && (
            <div className="iq-manual-context">
              <span className="iq-model-name">{manualInfo.model_name}</span>
              <span className="iq-ver-chip">v{manualInfo.version}</span>
            </div>
          )}

          <div className="iq-header-options">
            <button className="iq-btn-ghost"><Info size={18} /></button>
          </div>
        </div>
      </header>

      <main className="iq-chat-viewport">
        <div className="iq-chat-container">
          <AnimatePresence mode="popLayout">
          {!manualId && !loadingQR && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="iq-chat-hero"
            >
              <div className="iq-hero-shield">
                 <Shield size={64} />
              </div>
              <h2>Secure Session Required</h2>
              <p>Please scan the verified QR code on your appliance to unlock AI-powered technical assistance.</p>
              <div className="iq-hero-footer">Scan to authenticate device knowledge</div>
            </motion.div>
          )}

          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`iq-msg-row ${m.type}`}
            >
              <div className="iq-msg-avatar">
                {m.type === 'bot' ? <Cpu size={14} /> : <User size={14} />}
              </div>
              <div className="iq-msg-bubble">
                {m.image && (
                  <div className="iq-msg-img">
                    <img src={m.image} alt="User upload" />
                  </div>
                )}
                
                {m.is_vision && m.extracted_problem && (
                  <div className="iq-vision-badge">
                    <Maximize2 size={12} />
                    <span>Detected: {m.extracted_problem}</span>
                  </div>
                )}

                {m.cache?.hit && (
                  <div className="iq-cache-badge">
                    <Zap size={14} />
                    <span>Instant retrieval via semantic cache</span>
                  </div>
                )}

                <div className="iq-msg-text">{m.text}</div>

                {m.fallback && (
                  <div className="iq-warning-note">
                    <AlertCircle size={14} />
                    <span>General knowledge response — manual reference not found.</span>
                  </div>
                )}

                {m.sources && m.sources.length > 0 && (
                  <div className="iq-msg-sources">
                    <BookOpen size={12} />
                    <span>
                      Manual Refs: {[...new Set(m.sources.map(s => s.page).filter(p => p > 0))].sort((a,b)=>a-b).map(p => `p.${p}`).join(', ') || 'Contextual'}
                    </span>
                  </div>
                )}
                
                {m.type === 'bot' && m.video_url && (
                  <YouTubeCard url={m.video_url} />
                )}

                {m.type === 'bot' && m.steps && m.steps.length > 0 && (
                  <RepairSteps steps={m.steps} />
                )}

                {m.type === 'bot' && m.severity && (
                  <SeverityBadge severity={m.severity} />
                )}

                {m.type === 'bot' && m.cost && (
                  <CostEstimator cost={m.cost} />
                )}
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="iq-msg-row bot iq-typing"
            >
              <div className="iq-msg-avatar"><Cpu size={14} /></div>
              <div className="iq-msg-bubble">
                <div className="iq-typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="iq-chat-footer">
        <div className="iq-footer-inner">
          <div className="iq-input-envelope">
            <button className="iq-input-btn" onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              style={{ display: 'none' }}
            />

            <div className="iq-input-area">
              <textarea
                placeholder="Ask about your appliance..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                rows="1"
              />
            </div>

            <div className="iq-input-actions">
              <button className="iq-input-btn" onClick={() => setIsCameraOpen(true)}>
                <Camera size={20} />
              </button>
              <button className={`iq-input-btn ${isListening ? 'active' : ''}`} onClick={startListening}>
                <Mic size={20} />
              </button>
              <button 
                className="iq-send-btn"
                onClick={handleSend} 
                disabled={loading || (!input.trim() && !imageFile)}
              >
                {loading ? <Loader className="spinner" size={18} /> : <Send size={18} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="iq-upload-preview"
              >
                <img src={imagePreview} alt="Preview" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}>
                  <X size={12} />
                </button>
                <span>Image attached</span>
              </motion.div>
            )}
            
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="iq-vision-overlay"
              >
                <div className="iq-scan-line" />
                <p>Analyzing problem visual...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </footer>

      {isCameraOpen && (
        <LiveCameraOverlay 
          onClose={() => setIsCameraOpen(false)}
          onIssueDetected={triggerAutoSend}
          manualId={manualId}
        />
      )}

      {showFeedback && (
        <div className="iq-feedback-toast">
          <div className="iq-feedback-card">
            <span>Was this helpful?</span>
            <div className="iq-star-row">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => submitFeedback(r)} className="iq-star-btn">
                  <Star size={16} />
                </button>
              ))}
            </div>
            <button className="iq-close-feedback" onClick={() => setShowFeedback(false)}><X size={14} /></button>
          </div>
        </div>
      )}

      <style jsx>{`
        .iq-chat-page {
          height: 100vh;
          background: #0B0F1A;
          color: #F9FAFB;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .iq-chat-header {
          background: rgba(11, 15, 26, 0.8);
          backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          height: 64px;
          flex-shrink: 0;
          z-index: 50;
        }
        .iq-chat-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .iq-chat-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }
        .iq-brand-icon-sm {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .iq-chat-ident h3 {
          font-size: 0.9375rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .iq-status {
          font-size: 0.6875rem;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }
        .iq-status-dot {
          width: 6px;
          height: 6px;
          background: #10B981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10B981;
        }
        .iq-manual-context {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 4px 12px;
          border-radius: 999px;
        }
        .iq-model-name { font-size: 0.75rem; font-weight: 700; color: #D1D5DB; }
        .iq-ver-chip { font-size: 0.625rem; background: rgba(59, 130, 246, 0.1); color: #60A5FA; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        .iq-btn-ghost { background: none; border: none; color: #6B7280; cursor: pointer; padding: 8px; transition: 0.2s; }
        .iq-btn-ghost:hover { color: white; background: rgba(255,255,255,0.05); border-radius: 8px; }

        .iq-chat-viewport {
          flex: 1;
          overflow-y: auto;
          background: 
            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.03) 0%, transparent 30%),
            radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.03) 0%, transparent 30%);
          padding: 40px 16px;
        }
        .iq-chat-container {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .iq-chat-hero {
          text-align: center;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .iq-hero-shield {
          width: 100px;
          height: 100px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3B82F6;
          margin-bottom: 16px;
          animation: iq-float 3s infinite ease-in-out;
        }
        @keyframes iq-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .iq-chat-hero h2 { font-size: 1.5rem; font-weight: 800; color: white; }
        .iq-chat-hero p { color: #9CA3AF; max-width: 400px; line-height: 1.6; font-size: 0.9375rem; }
        .iq-hero-footer { font-size: 0.75rem; color: #4B5563; font-style: italic; margin-top: 16px; }

        .iq-msg-row { display: flex; gap: 12px; max-width: 85%; }
        .iq-msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
        .iq-msg-row.bot { align-self: flex-start; }

        .iq-msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .iq-msg-row.bot .iq-msg-avatar { 
          background: rgba(59, 130, 246, 0.1); 
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3B82F6;
        }
        .iq-msg-row.user .iq-msg-avatar {
          background: rgba(255, 255, 255, 0.05);
          color: #9CA3AF;
        }

        .iq-msg-bubble {
          padding: 14px 18px;
          border-radius: 18px;
          font-size: 0.9375rem;
          line-height: 1.6;
          position: relative;
        }
        .iq-msg-row.bot .iq-msg-bubble {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-top-left-radius: 4px;
        }
        .iq-msg-row.user .iq-msg-bubble {
          background: #2563EB;
          color: white;
          border-top-right-radius: 4px;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.2);
        }

        .iq-msg-img { margin-bottom: 12px; border-radius: 12px; overflow: hidden; max-width: 280px; }
        .iq-msg-img img { width: 100%; display: block; }

        .iq-vision-badge, .iq-cache-badge, .iq-warning-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .iq-vision-badge { background: rgba(59, 130, 246, 0.1); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.2); }
        .iq-cache-badge { background: rgba(16, 185, 129, 0.1); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.2); }
        .iq-warning-note { background: rgba(245, 158, 11, 0.05); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.1); }

        .iq-msg-sources {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6B7280;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .iq-typing-dots { display: flex; gap: 4px; padding: 4px 0; }
        .iq-typing-dots span { width: 6px; height: 6px; background: #3B82F6; border-radius: 50%; opacity: 0.4; animation: iq-bounce 1.4s infinite ease-in-out; }
        .iq-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .iq-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes iq-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1.1); opacity: 1; } }

        .iq-chat-footer {
          padding: 16px 24px 32px;
          background: linear-gradient(to top, #0B0F1A 80%, transparent);
          z-index: 50;
        }
        .iq-footer-inner {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
        }
        .iq-input-envelope {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 8px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          transition: 0.2s;
        }
        .iq-input-envelope:focus-within {
          border-color: rgba(59, 130, 246, 0.4);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        }
        .iq-input-btn {
          width: 40px;
          height: 40px;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .iq-input-btn:hover { color: white; background: rgba(255, 255, 255, 0.05); }
        .iq-input-btn.active { color: #EF4444; background: rgba(239, 68, 68, 0.1); }

        .iq-input-area { flex: 1; padding: 8px 12px; }
        .iq-input-area textarea {
          width: 100%;
          background: none;
          border: none;
          color: white;
          font-family: inherit;
          font-size: 0.9375rem;
          resize: none;
          padding: 0;
          max-height: 120px;
        }
        .iq-input-area textarea:focus { outline: none; }

        .iq-input-actions { display: flex; align-items: center; gap: 4px; }
        .iq-send-btn {
          width: 40px;
          height: 40px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
          margin-left: 4px;
        }
        .iq-send-btn:hover:not(:disabled) { background: #2563EB; transform: translateY(-1px); }
        .iq-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .iq-upload-preview {
          position: absolute; bottom: 100%; right: 0;
          background: #1F2937; border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px; border-radius: 12px;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .iq-upload-preview img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
        .iq-upload-preview button {
          position: absolute; top: -6px; right: -6px;
          background: #EF4444; color: white; border: none;
          border-radius: 50%; width: 18px; height: 18px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .iq-upload-preview span { font-size: 0.75rem; color: #94A3B8; padding-right: 8px; }

        .iq-vision-overlay {
          position: absolute; inset: 0; background: rgba(11, 15, 26, 0.9);
          backdrop-filter: blur(8px); display: flex; flex-direction: column;
          align-items: center; justify-content: center; z-index: 100; border-radius: 20px;
        }
        .iq-scan-line { width: 80%; height: 2px; background: #3B82F6; box-shadow: 0 0 16px #3B82F6; animation: iq-scan 2s infinite linear; }
        @keyframes iq-scan { 0% { opacity: 0; transform: translateY(-30px); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateY(30px); } }
        .iq-vision-overlay p { margin-top: 16px; color: #60A5FA; font-weight: 700; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; }

        .iq-feedback-toast {
          position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
          z-index: 100;
        }
        .iq-feedback-card {
          background: rgba(17, 24, 39, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 20px; border-radius: 999px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
          animation: iq-pop 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        }
        @keyframes iq-pop { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .iq-star-row { display: flex; gap: 4px; }
        .iq-star-btn { background: none; border: none; color: #4B5563; cursor: pointer; transition: 0.2s; padding: 4px; }
        .iq-star-btn:hover { color: #F59E0B; transform: scale(1.2); }
        .iq-close-feedback { background: none; border: none; color: #6B7280; cursor: pointer; }

        .iq-chat-loader { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
        .iq-loader-glow { width: 100px; height: 100px; position: relative; display: flex; align-items: center; justify-content: center; }
        .iq-loader-glow::after { content: ''; position: absolute; width: 100%; height: 100%; border: 2px solid rgba(59, 130, 246, 0.1); border-top-color: #3B82F6; border-radius: 50%; animation: spin 1s linear infinite; }
        .iq-spin-cpu { color: #3B82F6; filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4)); animation: pulse 2s infinite; }
        .iq-chat-loader h2 { font-weight: 800; letter-spacing: -0.03em; }
        .iq-chat-loader p { color: #64748B; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; }

        .iq-youtube-card {
          margin-top: 16px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 0, 0, 0.1);
          border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; text-decoration: none;
        }
        .iq-yt-icon { width: 40px; height: 40px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #EF4444; }
        .iq-yt-info h5 { margin: 0; font-size: 0.875rem; color: white; }
        .iq-yt-info p { margin: 2px 0 0; font-size: 0.75rem; color: #9CA3AF; }

        @media (max-width: 640px) {
          .iq-chat-header-inner { padding: 0 16px; }
          .iq-manual-context { display: none; }
          .iq-msg-row { max-width: 92%; }
          .iq-chat-footer { padding: 12px 12px 24px; }
        }
      `}</style>
    </div>
  );
}

function YouTubeCard({ url }) {
  return (
    <motion.a 
      href={url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="iq-youtube-card"
    >
      <div className="iq-yt-icon"><Youtube size={20} /></div>
      <div className="iq-yt-info">
        <h5>Visual Repair Guide</h5>
        <p>Watch step-by-step resolution on YouTube</p>
      </div>
      <ChevronRight size={16} style={{ marginLeft: 'auto', color: '#4B5563' }} />
    </motion.a>
  );
}

function RepairSteps({ steps }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="iq-steps-box">
      <div className="iq-steps-top">
        <MessageSquare size={13} />
        <span>Actionable Repair Guide</span>
      </div>
      
      <div className="iq-steps-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="iq-step-item"
          >
            <div className="iq-step-tag">Step {current + 1} of {steps.length}</div>
            <h5>{steps[current].title}</h5>
            <p>{steps[current].description}</p>
            {steps[current].warning && (
              <div className="iq-step-warn">
                <AlertCircle size={12} />
                <span>{steps[current].warning}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="iq-steps-nav">
        <div className="iq-steps-dots">
          {steps.map((_, i) => (
            <div key={i} className={`iq-dot ${i === current ? 'active' : ''}`} />
          ))}
        </div>
        <div className="iq-steps-btns">
          <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)}><ChevronLeft size={16} /></button>
          <button disabled={current === steps.length - 1} onClick={() => setCurrent(c => c + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      <style jsx>{`
        .iq-steps-box { margin-top: 16px; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 14px; overflow: hidden; }
        .iq-steps-top { padding: 10px 14px; background: rgba(59, 130, 246, 0.05); border-bottom: 1px solid rgba(59, 130, 246, 0.1); display: flex; align-items: center; gap: 8px; font-size: 0.6875rem; font-weight: 800; color: #60A5FA; text-transform: uppercase; letter-spacing: 0.05em; }
        .iq-steps-body { padding: 16px; min-height: 140px; }
        .iq-step-tag { font-family: monospace; font-size: 0.625rem; font-weight: 800; color: #3B82F6; margin-bottom: 6px; text-transform: uppercase; }
        .iq-step-item h5 { margin: 0; font-size: 1rem; color: #F8FAF7; font-weight: 700; }
        .iq-step-item p { margin: 8px 0; font-size: 0.875rem; color: #94A3B8; line-height: 1.5; }
        .iq-step-warn { display: flex; align-items: flex-start; gap: 8px; background: rgba(245, 158, 11, 0.08); padding: 8px 12px; border-radius: 8px; color: #F59E0B; font-size: 0.75rem; margin-top: 12px; border: 1px solid rgba(245, 158, 11, 0.1); }
        .iq-steps-nav { padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.1); }
        .iq-steps-dots { display: flex; gap: 4px; }
        .iq-dot { width: 5px; height: 5px; border-radius: 50%; background: #334155; }
        .iq-dot.active { background: #3B82F6; width: 12px; border-radius: 4px; }
        .iq-steps-btns { display: flex; gap: 8px; }
        .iq-steps-btns button { width: 28px; height: 28px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .iq-steps-btns button:hover:not(:disabled) { background: rgba(59, 130, 246, 0.15); border-color: #3B82F6; }
        .iq-steps-btns button:disabled { opacity: 0.2; }
      `}</style>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const configs = {
    minor: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
    moderate: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
    critical: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' }
  };
  const config = configs[severity] || configs.minor;

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px',
        backgroundColor: config.bg, border: `1px solid ${config.border}`, color: config.color,
        fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em'
      }}>
        <AlertCircle size={12} />
        {severity} Severity
      </div>
      {severity === 'critical' && (
        <p style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '8px', fontStyle: 'italic', opacity: 0.9 }}>
          Caution: Professional intervention is advised for this issue.
        </p>
      )}
    </div>
  );
}

function CostEstimator({ cost }) {
  return (
    <div style={{
      marginTop: '16px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', fontSize: '0.8125rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#9CA3AF', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase' }}>
        <Zap size={12} />
        Repair Budget Est.
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div><span style={{ color: '#6B7280', display: 'block', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: '2px' }}>DIY Fix</span> <strong style={{ color: 'white' }}>{cost.diy}</strong></div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <div><span style={{ color: '#6B7280', display: 'block', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: '2px' }}>Professional</span> <strong style={{ color: 'white' }}>{cost.professional}</strong></div>
      </div>
    </div>
  );
}
