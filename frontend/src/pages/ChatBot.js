import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import { Send, Loader, Bot, User, Star, Mic, Image as ImageIcon, X, Shield, Paperclip, Maximize2, Info, ChevronDown } from 'lucide-react';
import { MorphingButton } from '../components/ui/morphing-button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
        const id = searchParams.get('manual_id') || localStorage.getItem('manual_id');
        if (id) {
          setManualId(id);
          localStorage.setItem('manual_id', id);

          setMessages([{
            type: 'bot',
            text: "Welcome back! I'm ready to answer any questions about your appliance. What would you like to know?"
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
    if (!input.trim() || !manualId) return;

    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        manual_id: manualId,
        question: input
      });

      const botMessage = {
        type: 'bot',
        text: response.data.answer,
        sources: response.data.sources,
        manual_info: response.data.manual_info
      };

      setMessages(prev => [...prev, botMessage]);
      setManualInfo(response.data.manual_info);
      setLastQueryId(response.data.query_id);
      setShowFeedback(true);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
      }]);
    } finally {
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

  const handleImageUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAnalyzingImage(true);
    setMessages(prev => [...prev, { type: 'user', text: '📷 Analyzing uploaded image...', isSystem: true }]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/analyze-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      const analysis = response.data.analysis;
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        newMsgs.push({ type: 'bot', text: `I've analyzed the image. It looks like it related to: ${analysis}. Ask me anything about it!` });
        return newMsgs;
      });
      setInput(analysis);
    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        newMsgs.push({ type: 'bot', text: "I couldn't analyze the image. Please try describing the issue manually." });
        return newMsgs;
      });
    } finally {
      setAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loadingQR) {
    return (
      <div className="chat-page dark-theme">
        <div className="full-screen-loader">
          <Loader className="spinner" size={48} />
          <h2>Syncing Workspace...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page dark-theme">
      {/* Premium Header */}
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

      {/* Main Chat Area */}
      <main className="messages-viewport">
        <div className="messages-list">
          {!manualId && !loadingQR && (
            <div className="no-manual-hero">
              <Shield size={64} className="text-primary" />
              <h2>Security Gateway</h2>
              <p>This agent requires a valid resource signature. Please scan a verified QR code to access device intelligence.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`message-row ${m.type}`}>
              <div className="avatar-holder">
                {m.type === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="message-bubble">
                <p>{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="sources-chips">
                    <Info size={12} />
                    <span>Powered by {m.sources.length} document references</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-row bot typing">
              <div className="avatar-holder"><Bot size={18} /></div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Sticky Feedback */}
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

      {/* Floating Input Area */}
      <footer className="input-footer">
        <div className="input-belt-glass">
          <button className="utility-btn" onClick={handleImageUpload} disabled={analyzingImage}>
            <Paperclip size={20} />
          </button>

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
            <button className="send-prime" onClick={handleSend} disabled={!input.trim() || loading}>
              <Send size={18} />
            </button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
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

        .full-screen-loader {
            height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: #64748b;
        }

        .chat-header-glass {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding: 1rem 1.5rem;
            z-index: 50;
        }

        .header-inner {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .bot-identity { display: flex; align-items: center; gap: 1rem; }
        .bot-glow-box {
            width: 44px; height: 44px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            color: #3b82f6;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
        }

        .bot-text h3 { font-size: 0.9375rem; font-weight: 800; margin: 0; }
        .online-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.6875rem; color: #64748b; font-weight: 600; }
        .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 5px #10b981; }

        .manual-badge-box {
            background: rgba(255,255,255,0.03);
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            border: 1px solid rgba(255,255,255,0.08);
            display: flex; align-items: center; gap: 0.75rem;
            font-size: 0.75rem;
        }
        .m-model { font-weight: 700; }
        .m-ver { color: #64748b; font-weight: 600; padding-left: 0.75rem; border-left: 1px solid rgba(255,255,255,0.1); }

        .messages-viewport {
            flex: 1;
            overflow-y: auto;
            padding: 2rem 1rem;
            background-image: 
                radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.03) 0%, transparent 40%),
                radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.03) 0%, transparent 40%);
        }

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
      `}</style>
    </div>
  );
}
