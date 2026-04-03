import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LogOut, MessageSquare, TrendingUp, Star, Loader, Shield, Activity, Users, ArrowUpRight, MessageCircle, BarChart3, Filter } from 'lucide-react';
import { StatCard } from '../components/ui/stat-card';
import Navbar from '../components/ui/Navbar';

import { API_BASE_URL as API } from '../config';

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
    <div className="analytics-page">
      <Navbar user={user} onLogout={onLogout} activePage="analytics" />

      <div className="main-container">
        <header className="page-header">
          <div className="header-left">
            <h1>Intelligence Reports</h1>
            <p>Analyzing customer sentiment and retrieval performance metrics.</p>
          </div>
          <div className="header-actions">
            <button className="btn-glass"><Filter size={16} /> Last 30 Days</button>
          </div>
        </header>

        <div className="stats-row">
          <StatCard
            title="Total Conversations"
            amount={queries.length.toString()}
            percentage="+24%"
            isPositive={true}
          />
          <StatCard
            title="Global Sentiment"
            amount={`${avgRating}/5`}
            percentage="+0.2"
            isPositive={true}
          />
          <StatCard
            title="Feedback Density"
            amount={feedback.length.toString()}
            percentage="+8%"
            isPositive={true}
          />
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader className="spinner" size={40} />
            <span>Processing data streams...</span>
          </div>
        ) : (
          <div className="analytics-layout">
            {/* Main Log Section */}
            <div className="data-section">
              <div className="section-head">
                <div className="head-title">
                  <Activity size={20} className="text-primary" />
                  <h2>Knowledge Retrieval Log</h2>
                </div>
              </div>

              <div className="scrollable-table-card">
                {queries.length === 0 ? (
                  <div className="empty-log">
                    <MessageSquare size={48} />
                    <p>Monitoring active system queries...</p>
                  </div>
                ) : (
                  <table className="log-table">
                    <thead>
                      <tr>
                        <th>Inquiry</th>
                        <th>Status</th>
                        <th>Latency</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.map((q, i) => (
                        <tr key={q.id || i}>
                          <td className="query-cell">
                            <span className="quest-text">{q.question}</span>
                            <span className="ans-text">{q.answer.substring(0, 100)}...</span>
                          </td>
                          <td><span className="token-status">Active</span></td>
                          <td><span className="latency text-muted">240ms</span></td>
                          <td className="timestamp">{new Date(q.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Side Sentiment Section */}
            <div className="side-section">
              <div className="section-head">
                <div className="head-title">
                  <Star size={20} className="text-warning" />
                  <h2>User Feedback</h2>
                </div>
              </div>

              <div className="feedback-stack">
                {feedback.length === 0 ? (
                  <div className="empty-feedback">
                    <span>No feedback points yet.</span>
                  </div>
                ) : (
                  feedback.map((f, i) => (
                    <div className="feedback-item-glass" key={f.id || i}>
                      <div className="f-header">
                        <div className="stars">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              size={12}
                              fill={idx < f.rating ? '#fbbf24' : 'none'}
                              color={idx < f.rating ? '#fbbf24' : '#475569'}
                            />
                          ))}
                        </div>
                        <span className="f-date">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      {f.comment && <p className="f-comment">{f.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .analytics-page {
          min-height: 100vh;
          background: #09090b;
          background-image: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .main-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3.5rem; }
        .page-header h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.05em; margin: 0; }
        .page-header p { color: #64748b; margin-top: 0.5rem; }

        .btn-glass {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            color: white;
            padding: 0.625rem 1.25rem;
            border-radius: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 4rem;
        }

        .analytics-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2.5rem;
        }

        .section-head { margin-bottom: 2rem; }
        .head-title { display: flex; align-items: center; gap: 0.75rem; }
        .head-title h2 { font-size: 1.25rem; font-weight: 800; margin: 0; border: none; letter-spacing: -0.02em; }

        .scrollable-table-card {
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 2rem;
            overflow: hidden;
        }

        .log-table { width: 100%; border-collapse: collapse; text-align: left; }
        .log-table th { padding: 1.25rem 1.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .log-table td { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.02); }

        .query-cell { position: relative; max-width: 400px; }
        .quest-text { display: block; font-weight: 700; font-size: 0.9375rem; margin-bottom: 0.375rem; }
        .ans-text { display: block; font-size: 0.8125rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .token-status { 
            background: rgba(16, 185, 129, 0.1); 
            color: #10b981; 
            font-size: 0.65rem; 
            font-weight: 800; 
            padding: 0.25rem 0.625rem; 
            border-radius: 2rem; 
        }
        
        .timestamp { font-size: 0.8125rem; color: #475569; font-weight: 500; }

        .side-section { display: flex; flex-direction: column; }
        .feedback-stack { display: flex; flex-direction: column; gap: 1.25rem; }
        .feedback-item-glass {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 1.5rem;
            border-radius: 1.5rem;
            transition: 0.2s;
        }
        .feedback-item-glass:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }

        .f-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .f-date { font-size: 0.75rem; color: #475569; }
        .f-comment { font-size: 0.875rem; line-height: 1.6; color: #94a3b8; margin: 0; }

        .empty-log, .empty-feedback {
            padding: 5rem;
            text-align: center;
            color: #475569;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }

        .loading-state { padding: 10rem 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; color: #64748b; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
            .analytics-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
