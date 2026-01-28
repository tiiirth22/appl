import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LogOut, MessageSquare, TrendingUp, Star, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Analytics({ user, onLogout }) {
  const [queries, setQueries] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [queriesRes, feedbackRes] = await Promise.all([
        axios.get(`${API}/analytics/queries`, { withCredentials: true }),
        axios.get(`${API}/feedback`, { withCredentials: true })
      ]);
      
      setQueries(queriesRes.data.queries || []);
      setFeedback(feedbackRes.data.feedback || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 0;

  return (
    <div className="analytics-page" data-testid="analytics-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <h2 className="navbar-brand">ApplianceIQ</h2>
          <div className="navbar-links">
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
            <Link to="/upload" className="navbar-link">Upload Manual</Link>
            <Link to="/analytics" className="navbar-link">Analytics</Link>
          </div>
          <div className="navbar-user">
            <img src={user.picture || 'https://via.placeholder.com/40'} alt={user.name} />
            <span>{user.name}</span>
            <button onClick={onLogout} className="btn-logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="analytics-header">
          <div>
            <h1 data-testid="analytics-title">Analytics Dashboard</h1>
            <p>Monitor customer queries and feedback</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="stat-value" data-testid="total-queries">{queries.length}</div>
              <div className="stat-label">Total Queries</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Star size={24} />
            </div>
            <div>
              <div className="stat-value" data-testid="avg-rating">{avgRating}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="stat-value">{feedback.length}</div>
              <div className="stat-label">Total Feedback</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader className="spinner" size={40} />
          </div>
        ) : (
          <>
            {/* Recent Queries */}
            <div className="section">
              <h2>Recent Queries</h2>
              {queries.length === 0 ? (
                <div className="empty-state" data-testid="empty-queries">
                  <p>No queries yet</p>
                </div>
              ) : (
                <div className="queries-list" data-testid="queries-list">
                  {queries.map((query, idx) => (
                    <div key={query.id || idx} className="query-card">
                      <div className="query-header">
                        <strong>{query.question}</strong>
                        <span className="query-date">
                          {new Date(query.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="query-answer">{query.answer}</p>
                      {query.sources && query.sources.length > 0 && (
                        <div className="query-sources">
                          <small>Sources: {query.sources.length} chunks</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback */}
            <div className="section">
              <h2>Customer Feedback</h2>
              {feedback.length === 0 ? (
                <div className="empty-state" data-testid="empty-feedback">
                  <p>No feedback yet</p>
                </div>
              ) : (
                <div className="feedback-list" data-testid="feedback-list">
                  {feedback.map((item, idx) => (
                    <div key={item.id || idx} className="feedback-card">
                      <div className="feedback-header">
                        <div className="rating">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={i < item.rating ? '#fbbf24' : 'none'}
                              color="#fbbf24"
                            />
                          ))}
                        </div>
                        <span className="feedback-date">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {item.comment && <p>{item.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .analytics-page {
          min-height: 100vh;
          background: #f7fafc;
        }

        .analytics-header {
          padding: 2rem 0;
          margin-bottom: 2rem;
        }

        .analytics-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .analytics-header p {
          color: #718096;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
        }

        .stat-label {
          color: #718096;
          font-size: 0.875rem;
        }

        .section {
          margin-bottom: 3rem;
        }

        .section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #2d3748;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          padding: 3rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
          color: #667eea;
        }

        .empty-state {
          background: white;
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
          color: #a0aec0;
        }

        .queries-list,
        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .query-card,
        .feedback-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .query-header,
        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .query-date,
        .feedback-date {
          color: #a0aec0;
          font-size: 0.875rem;
        }

        .query-answer {
          color: #4a5568;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .query-sources {
          color: #667eea;
          font-size: 0.875rem;
        }

        .rating {
          display: flex;
          gap: 0.25rem;
        }

        .feedback-card p {
          color: #4a5568;
          line-height: 1.6;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
