import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import { Send, Loader, Bot, User, Star } from 'lucide-react';

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
  const messagesEndRef = useRef(null);

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
        } catch (error) {
          console.error('Error fetching QR details:', error);
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
        }
      }

      // Add welcome message if we have a manual
      if (manualId || qrId) {
        setMessages([{
          type: 'bot',
          text: 'Hello! I\'m your appliance manual assistant. Ask me anything about your device!'
        }]);
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
      const errorMessage = {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
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
      await axios.post(`${API}/feedback`, {
        query_id: lastQueryId,
        rating: rating
      });
      setShowFeedback(false);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  if (loadingQR) {
    return (
      <div className="chatbot">
        <div className="loading-state">
          <Loader className="spinner" size={64} />
          <h2>Loading Manual Details...</h2>
        </div>
        <style jsx>{`
          .chatbot {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loading-state {
            text-align: center;
            color: white;
          }
          .spinner {
            animation: spin 1s linear infinite;
            margin-bottom: 2rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!manualId) {
    return (
      <div className="chatbot" data-testid="chatbot-no-manual">
        <div className="error-state">
          <Bot size={64} />
          <h2>No Manual Selected</h2>
          <p>Please scan a QR code or use a valid link to access the manual assistant.</p>
        </div>

        <style jsx>{`
          .chatbot {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .error-state {
            text-align: center;
            color: white;
            padding: 2rem;
          }

          .error-state svg {
            margin-bottom: 1rem;
            opacity: 0.8;
          }

          .error-state h2 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="chatbot" data-testid="chatbot-page">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <Bot size={32} />
          <div>
            <h2>Appliance Assistant</h2>
            {manualInfo && (
              <p>{manualInfo.model_name} - {manualInfo.version}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container" data-testid="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.type}`}
            data-testid={`message-${message.type}`}
          >
            <div className="message-avatar">
              {message.type === 'bot' ? <Bot size={24} /> : <User size={24} />}
            </div>
            <div className="message-content">
              <p>{message.text}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  <small>Sources: {message.sources.length} chunks from manual</small>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot" data-testid="loading-message">
            <div className="message-avatar">
              <Bot size={24} />
            </div>
            <div className="message-content">
              <Loader className="spinner" size={20} />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Feedback (shown after response) */}
      {showFeedback && (
        <div className="feedback-bar" data-testid="feedback-bar">
          <span>How helpful was this answer?</span>
          <div className="rating-buttons">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => submitFeedback(rating)}
                className="rating-btn"
                data-testid={`rating-${rating}`}
              >
                <Star size={20} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            data-testid="chat-input"
            placeholder="Ask about your appliance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            className="send-btn"
            data-testid="send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .chatbot {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .chat-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          max-width: 900px;
          width: 100%;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .header-info h2 {
          font-size: 1.125rem;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }

        .header-info p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0.125rem 0 0 0;
          font-weight: 500;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          scroll-behavior: smooth;
        }

        .message-wrapper {
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .message {
          display: flex;
          gap: 1.25rem;
          max-width: 80%;
          animation: messageFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes messageFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.bot { align-self: flex-start; }
        .message.user { align-self: flex-end; flex-direction: row-reverse; }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .message.bot .message-avatar {
          background: #eef2ff;
          color: #6366f1;
          border: 1px solid #e0e7ff;
        }

        .message.user .message-avatar {
          background: #f1f5f9;
          color: #475569;
        }

        .message-content {
          padding: 1.125rem 1.5rem;
          border-radius: 1.25rem;
          font-size: 0.9375rem;
          line-height: 1.6;
          position: relative;
        }

        .message.bot .message-content {
          background: white;
          color: #1e293b;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02);
          border: 1px solid #f1f5f9;
          border-top-left-radius: 0.25rem;
        }

        .message.user .message-content {
          background: #6366f1;
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          border-top-right-radius: 0.25rem;
        }

        .sources {
          margin-top: 1rem;
          padding-top: 0.875rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .source-tag {
          font-size: 0.75rem;
          color: #6366f1;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }

        .chat-input-container {
          background: white;
          padding: 1.5rem 2rem 2.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: center;
        }

        .chat-input-wrapper {
          max-width: 900px;
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .chat-input {
          flex: 1;
          padding: 1.125rem 1.5rem;
          padding-right: 4rem;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: #0f172a;
        }

        .chat-input:focus {
          outline: none;
          background: white;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .send-btn {
          position: absolute;
          right: 0.625rem;
          width: 3rem;
          height: 3rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #4f46e5;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .feedback-bar {
          background: #f8fafc;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .feedback-bar span {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .rating-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .rating-btn {
          background: white;
          border: 1px solid #e2e8f0;
          width: 36px;
          height: 36px;
          border-radius: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rating-btn:hover {
          border-color: #fbbf24;
          color: #fbbf24;
          background: #fffbeb;
        }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .message { max-width: 90%; }
          .chat-header { padding: 1rem; }
          .chat-input-container { padding: 1rem; }
        }
      `}</style>
    </div>
  );
}
