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
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastQueryId, setLastQueryId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Get manual ID from URL
    const id = searchParams.get('manual_id') || localStorage.getItem('manual_id');
    if (id) {
      setManualId(id);
      localStorage.setItem('manual_id', id);
      // Add welcome message
      setMessages([{
        type: 'bot',
        text: 'Hello! I\'m your appliance manual assistant. Ask me anything about your device!'
      }]);
    }
  }, [searchParams]);

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
      setShowFeedback(true);
      // Note: In a real implementation, you'd get query_id from response
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
          background: #f7fafc;
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .header-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .header-content p {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem 1rem;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
        }

        .message {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message.bot .message-avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message.user .message-avatar {
          background: #e2e8f0;
          color: #4a5568;
        }

        .message-content {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          max-width: 70%;
          word-wrap: break-word;
        }

        .message.user .message-content {
          background: #667eea;
          color: white;
        }

        .message-content p {
          margin: 0;
          line-height: 1.6;
        }

        .sources {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e2e8f0;
          color: #667eea;
          font-size: 0.875rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .feedback-bar {
          background: white;
          padding: 1rem;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .rating-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .rating-btn {
          background: none;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem;
          cursor: pointer;
          color: #cbd5e0;
          transition: all 0.2s;
        }

        .rating-btn:hover {
          border-color: #fbbf24;
          color: #fbbf24;
        }

        .chat-input-container {
          background: white;
          padding: 1.5rem;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        }

        .chat-input-wrapper {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          gap: 1rem;
        }

        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .chat-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .send-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .message-content {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
}
