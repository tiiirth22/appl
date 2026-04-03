import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import { Send, Loader, Bot, User, Star, Mic, Image as ImageIcon, X, Shield, Paperclip, Maximize2, Info, ChevronDown, Youtube, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MorphingButton } from '../components/ui/morphing-button';

import { API_BASE_URL as API } from '../config';

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
      // Priority 1: qrId from URL path (/device/:qrId)
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
            text: `Hello! I'm your AI assistant for the **${model_name}**. I've indexed the technical manual for version ${version}. How can I assist you with your device today?`
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
      // Priority 2: manual_id from search params (?manual_id=...)
      else {
        const id = searchParams.get('manual_id');
        const token = localStorage.getItem('session_token');

        if (id && token) {
          // If the user is AUTHENTICATED, they can access any manual they own or have access to
          setManualId(id);
          setMessages([{
            type: 'bot',
            text: "Welcome back! I'm ready to answer any questions about your appliance. What would you like to know?"
          }]);
        } else if (!id && !qrId) {
          // If NO ID and NO QR, it's an invalid access
          setMessages([{
            type: 'bot',
            text: "⚠️ **Security Required**: Please scan the official QR code located on your appliance to start a session."
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

  const handleSend = async () => {
    if ((!input.trim() && !imageFile) || loading || !manualId) return;

    const userMessage = { 
      type: 'user', 
      text: input, 
      image: imagePreview 
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
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
        // Multipart upload for image vision
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
        // Standard JSON request for text RAG
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
            botMessage.extracted_problem = metadata.extracted_problem;
            botMessage.is_vision = metadata.is_vision;
            
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
        text: "I apologize, but I encountered an error processing your request. Please try again."
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
      <div className="chat-page dark-theme">
        <div className="premium-full-loader">
          <div className="loader-orbit">
             <div className="orbit-dot"></div>
             <Bot size={48} className="spin-bot" />
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          >
            Agent Initializing...
          </motion.h2>
          <p className="loader-subtext">Syncing device knowledge base</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page dark-theme">
      <header className="chat-header-glass">
        <div className="header-inner">
          <div className="bot-identity">
            <div className="bot-glow-box">
              <Bot size={24} />
            </div>
            <div className="bot-text">
              <h3>ApplianceAI Agent</h3>
              <span className="online-indicator">
                <span className="dot"></span>
                Knowledge Stream Active
              </span>
            </div>
          </div>

          {manualInfo && (
            <div className="manual-badge-box">
              <span className="m-model">{manualInfo.model_name}</span>
              <span className="m-ver">{manualInfo.version}</span>
            </div>
          )}

          <div className="header-actions">
            <button className="icon-btn-glass"><Maximize2 size={18} /></button>
          </div>
        </div>
      </header>

      <main className="messages-viewport">
        <div className="messages-list">
          <AnimatePresence mode="popLayout">
          {!manualId && !loadingQR && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="no-manual-hero"
            >
              <div className="hero-glow-icon">
                 <Shield size={80} className="pulse-shield" />
              </div>
              <h2 className="space-font">Secure Resource Required</h2>
              <p>This intelligence agent requires a valid device signature. Please scan a verified QR code to unlock specialized device assistance.</p>
              <div className="hero-hint">Looking for the QR? It's usually found on the back or bottom of your device.</div>
            </motion.div>
          )}

          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20, x: m.type === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`message-row ${m.type}`}
            >
              <div className="avatar-holder">
                {m.type === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className={`message-bubble ${m.type}`}>
                {m.image && (
                  <div className="message-image-preview">
                    <img src={m.image} alt="Uploaded" />
                  </div>
                )}
                {m.is_vision && m.extracted_problem && (
                  <div className="vision-extraction-badge">
                    <Maximize2 size={12} />
                    <span>Scanned Problem: {m.extracted_problem}</span>
                  </div>
                )}
                <p>{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="sources-chips">
                    <Info size={12} />
                    <span>
                      References: {[...new Set(m.sources.map(s => s.page).filter(p => p > 0))].sort((a,b)=>a-b).map(p => `Page ${p}`).join(', ') || 'Manual context'}
                    </span>
                  </div>
                )}
                
                {/* YouTube Video Card */}
                {m.type === 'bot' && m.video_url && (
                  <YouTubeCard url={m.video_url} />
                )}

                {/* Repair Steps Swipeable Cards */}
                {m.type === 'bot' && m.steps && m.steps.length > 0 && (
                  <RepairSteps steps={m.steps} />
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="message-row bot typing"
            >
              <div className="avatar-holder"><Bot size={18} /></div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {showFeedback && (
        <div className="feedback-overlay">
          <div className="feedback-card-glass">
            <span>Helpful?</span>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => submitFeedback(r)} className="star-btn">
                  <Star size={18} />
                </button>
              ))}
            </div>
            <button className="close-feedback" onClick={() => setShowFeedback(false)}><X size={14} /></button>
          </div>
        </div>
      )}

      <footer className="input-footer">
        <div className="input-belt-glass">
          <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            style={{ display: 'none' }}
          />

          <div className="text-area-wrapper">
            <textarea
              placeholder="Describe your issue or ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows="1"
            />
          </div>

          <div className="input-actions">
            <button className={`voice-btn ${isListening ? 'active' : ''}`} onClick={startListening}>
              <Mic size={20} />
            </button>
            <MorphingButton 
              onClick={handleSend} 
              disabled={loading || (!input.trim() && !imageFile)}
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
            </MorphingButton>
          </div>
        </div>
        
        <AnimatePresence>
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="image-upload-preview-bar"
            >
              <img src={imagePreview} alt="Preview" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }}>
                <X size={14} />
              </button>
              <span>Image attached</span>
            </motion.div>
          )}
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="vision-loading-overlay"
            >
              <div className="scanner-line" />
              <p>Analyzing problem image...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      <style jsx>{`
        .chat-page {
          height: 100vh;
          background: #020617;
          display: flex;
          flex-direction: column;
          color: white;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .messages-viewport {
            flex: 1;
            overflow-y: auto;
            padding: 2rem 1rem;
            background-image: 
                radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 40%);
        }

        .premium-full-loader {
            height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #f8fafc;
        }
        .premium-full-loader h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
        .loader-subtext { color: #64748b; font-size: 0.875rem; letter-spacing: 0.05em; text-transform: uppercase; }

        .loader-orbit {
            position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;
        }
        .orbit-dot {
            position: absolute; width: 100%; height: 100%; border: 2px solid rgba(59, 130, 246, 0.1); border-top-color: #3b82f6;
            border-radius: 50%; animation: spin 1s linear infinite;
        }
        .spin-bot { color: #3b82f6; filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.4)); animation: pulse 2s infinite ease-in-out; }

        .space-font { font-family: 'Space Grotesk', sans-serif; }

        .hero-glow-icon {
            position: relative; margin-bottom: 2rem;
            display: flex; align-items: center; justify-content: center;
        }
        .hero-glow-icon::after {
            content: ''; position: absolute; width: 120px; height: 120px; background: rgba(59, 130, 246, 0.15);
            filter: blur(40px); border-radius: 50%; z-index: -1;
        }
        .pulse-shield { color: #3b82f6; animation: float 3s infinite ease-in-out; }

        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        .hero-hint { margin-top: 2rem; font-size: 0.75rem; color: #475569; font-style: italic; }

        .messages-list { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }

        .no-manual-hero {
            padding: 6rem 2rem;
            text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }
        .no-manual-hero h2 { font-size: 1.75rem; font-weight: 900; margin-top: 1rem; }
        .no-manual-hero p { color: #64748b; max-width: 400px; line-height: 1.6; }

        .message-row { display: flex; gap: 1rem; max-width: 85%; }
        .message-row.user { flex-direction: row-reverse; align-self: flex-end; }
        .message-row.bot { align-self: flex-start; }

        .avatar-holder {
            width: 32px; height: 32px;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.05);
            color: #64748b;
            flex-shrink: 0;
            margin-top: 4px;
        }
        .message-row.bot .avatar-holder { border: 1px solid rgba(59, 130, 246, 0.2); color: #3b82f6; }

        .message-bubble {
            padding: 1rem 1.25rem;
            border-radius: 1.25rem;
            font-size: 0.9375rem;
            line-height: 1.6;
        }
        .message-row.bot .message-bubble {
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255,255,255,0.05);
            border-top-left-radius: 0.25rem;
        }
        .message-row.user .message-bubble {
            background: #2563eb;
            color: white;
            border-top-right-radius: 0.25rem;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
        }

        .sources-chips {
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex; align-items: center; gap: 0.5rem;
            font-size: 0.75rem; color: #64748b; font-weight: 600;
        }

        .typing-indicator { display: flex; gap: 4px; }
        .typing-indicator span { 
            width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; opacity: 0.4;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        .feedback-overlay {
            position: absolute;
            bottom: 6rem; left: 0; right: 0;
            display: flex; justify-content: center;
            pointer-events: none;
            z-index: 40;
        }
        .feedback-card-glass {
            pointer-events: auto;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            display: flex; align-items: center; gap: 1rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .star-row { display: flex; gap: 0.25rem; }
        .star-btn { background: none; border: none; color: #475569; cursor: pointer; padding: 0.25rem; }
        .star-btn:hover { color: #fbbf24; transform: scale(1.2); }
        .close-feedback { background: none; border: none; color: #475569; cursor: pointer; }

        .input-footer {
            padding: 1.5rem 2rem 2.5rem;
            max-width: 900px;
            width: 100%;
            margin: 0 auto;
        }

        .input-belt-glass {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1.5rem;
            padding: 0.625rem;
            display: flex; align-items: flex-end; gap: 0.75rem;
            transition: 0.2s;
        }
        .input-belt-glass:focus-within {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
        }

        .utility-btn, .voice-btn {
            width: 44px; height: 44px;
            background: none; border: none;
            color: #64748b; cursor: pointer;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            transition: 0.2s;
        }
        .utility-btn:hover { background: rgba(255,255,255,0.05); color: white; }
        .voice-btn:hover { color: #3b82f6; }
        .voice-btn.active { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .text-area-wrapper { flex: 1; min-height: 44px; display: flex; align-items: center; }
        .text-area-wrapper textarea {
            width: 100%; background: none; border: none;
            color: white; font-family: inherit; font-size: 0.9375rem;
            resize: none; padding: 0.5rem 0;
        }
        .text-area-wrapper textarea:focus { outline: none; }

        .input-actions { display: flex; align-items: center; gap: 0.5rem; }
        .send-prime {
            width: 44px; height: 44px;
            background: #2563eb; color: white; border: none;
            border-radius: 12px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: 0.2s;
        }
        .send-prime:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(37, 99, 235, 0.3); }
        .send-prime:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
            .chat-header-glass { padding: 0.75rem 1rem; }
            .manual-badge-box { display: none; }
            .input-footer { padding: 1rem; }
        }

        /* YouTube and Repair Steps Styles */
        .youtube-card-premium {
          margin-top: 1rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 0, 0, 0.1);
          border-radius: 1rem;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: 0.3s;
        }
        .youtube-card-premium:hover {
          border-color: rgba(255, 0, 0, 0.3);
          background: rgba(255, 0, 0, 0.05);
        }
        .yt-icon-box {
          width: 48px; height: 48px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .yt-info { flex: 1; }
        .yt-info h4 { font-size: 0.875rem; font-weight: 700; margin: 0; color: #fff; }
        .yt-info p { font-size: 0.75rem; color: #94a3b8; margin: 0.25rem 0 0; }
        .yt-btn {
          background: #FF0000;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          text-decoration: none;
          display: flex; align-items: center; gap: 0.25rem;
          font-size: 0.75rem; font-weight: 700;
          transition: 0.2s;
        }
        .yt-btn:hover { background: #CC0000; transform: scale(1.05); }

        .repair-steps-container {
          margin-top: 1.5rem;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 1rem;
          overflow: hidden;
        }
        .steps-header {
          padding: 0.75rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          border-bottom: 1px solid rgba(59, 130, 246, 0.1);
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 700; color: #60a5fa;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .steps-viewport {
          padding: 1.25rem;
          min-height: 180px;
          display: flex; align-items: center;
        }
        .step-card { width: 100%; }
        .step-number {
          font-size: 0.75rem; font-weight: 800; color: #3b82f6; margin-bottom: 0.5rem;
        }
        .step-title { font-size: 1rem; font-weight: 700; margin: 0; color: #f8fafc; }
        .step-desc { font-size: 0.875rem; color: #94a3b8; margin: 0.75rem 0; line-height: 1.5; }
        .step-warning {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          color: #f59e0b;
          font-size: 0.75rem;
        }
        .steps-controls {
          padding: 0.75rem 1rem;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(0, 0, 0, 0.2);
        }
        .steps-pagination { display: flex; gap: 4px; }
        .p-dot { width: 6px; height: 6px; border-radius: 50%; background: #334155; transition: 0.3s; }
        .p-dot.active { background: #3b82f6; width: 16px; border-radius: 3px; }
        .steps-nav { display: flex; gap: 0.5rem; }
        .steps-nav button {
          width: 32px; height: 32px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .steps-nav button:hover:not(:disabled) { background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; }
        .steps-nav button:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Vision Support Styles */
        .message-image-preview { margin-bottom: 0.75rem; border-radius: 8px; overflow: hidden; max-width: 200px; }
        .message-image-preview img { width: 100%; display: block; }
        
        .vision-extraction-badge {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.75rem;
          font-size: 0.75rem; font-weight: 600; color: #60a5fa;
        }

        .image-upload-preview-bar {
          position: absolute; bottom: 100%; right: 2rem;
          background: #1e293b; border: 1px solid #334155;
          padding: 0.5rem; border-radius: 12px;
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
        }
        .image-upload-preview-bar img { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
        .image-upload-preview-bar button {
          position: absolute; -top: 8px; -right: 8px;
          background: #ef4444; color: white; border: none;
          border-radius: 50%; width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .image-upload-preview-bar span { font-size: 0.75rem; color: #94a3b8; padding-right: 0.5rem; }

        .vision-loading-overlay {
          position: absolute; inset: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(4px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 100; border-radius: 1.5rem;
        }
        .scanner-line {
          width: 80%; height: 2px;
          background: #3b82f6;
          box-shadow: 0 0 15px #3b82f6;
          animation: scan 2s infinite ease-in-out;
        }
        @keyframes scan {
          0% { transform: translateY(-40px); }
          50% { transform: translateY(40px); }
          100% { transform: translateY(-40px); }
        }
        .vision-loading-overlay p { margin-top: 1rem; font-size: 0.875rem; color: #60a5fa; font-weight: 600; }
      `}</style>
    </div>
  );
}

// Sub-components for enhanced UI
function YouTubeCard({ url }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="youtube-card-premium"
    >
      <div className="yt-icon-box">
        <Youtube size={24} color="#FF0000" />
      </div>
      <div className="yt-info">
        <h4>Visual Repair Guide</h4>
        <p>Watch related modular fix videos on YouTube</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="yt-btn">
        <span>Watch</span>
        <ChevronRight size={16} />
      </a>
    </motion.div>
  );
}

function RepairSteps({ steps }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="repair-steps-container">
      <div className="steps-header">
        <Shield size={14} className="shield-icon" />
        <span>Step-by-Step Repair Guide</span>
      </div>
      
      <div className="steps-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="step-card"
          >
            <div className="step-number">Step {steps[current].step || current + 1}</div>
            <h5 className="step-title">{steps[current].title}</h5>
            <p className="step-desc">{steps[current].description}</p>
            {steps[current].warning && (
              <div className="step-warning">
                <AlertCircle size={14} />
                <span>{steps[current].warning}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="steps-controls">
        <div className="steps-pagination">
          {steps.map((_, i) => (
            <div key={i} className={`p-dot ${i === current ? 'active' : ''}`} />
          ))}
        </div>
        <div className="steps-nav">
          <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
            <ChevronLeft size={18} />
          </button>
          <button disabled={current === steps.length - 1} onClick={() => setCurrent(c => c + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
